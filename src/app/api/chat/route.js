export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatResponse, CHAT_MODEL } from "@/lib/gemini/client";
import { TUTOR_SYSTEM_PROMPT, STUDY_TECHNIQUES } from "@/lib/gemini/prompts";

export async function POST(req) {
  try {
    const { message, subjectId, studyTechnique = "neutral", history } = await req.json();

    if (!message || !subjectId) {
      return NextResponse.json(
        { error: "Faltan parámetros: message y subjectId son requeridos." },
        { status: 400 }
      );
    }

    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. API Key del usuario
    const userApiKey = user.user_metadata?.gemini_api_key;
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key de Gemini no configurada. Configúrala en la sección de ajustes." },
        { status: 400 }
      );
    }

    // 3. Obtener TODOS los chunks con metadata del documento (nombre + tipo)
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content, chunk_index, documents(name, file_type)")
      .eq("subject_id", subjectId)
      .order("chunk_index", { ascending: true });

    if (chunksError) {
      console.error("[Chat] Error obteniendo chunks:", chunksError);
      return NextResponse.json(
        { error: "Error recuperando el material de estudio: " + chunksError.message },
        { status: 500 }
      );
    }

    console.log(`[Chat] Chunks recuperados: ${chunks?.length ?? 0}`);

    // 4. Construir contexto agrupado por archivo (con nombre y tipo)
    let contextText;
    if (!chunks || chunks.length === 0) {
      contextText = "No hay documentos cargados en esta materia aún.";
    } else {
      // Agrupar chunks por archivo para que la IA los identifique por nombre
      const fileMap = new Map();
      for (const chunk of chunks) {
        const docName = chunk.documents?.name ?? "Documento sin nombre";
        const docType = (chunk.documents?.file_type ?? "txt").toUpperCase();
        const key = `${docName}|||${docType}`;
        if (!fileMap.has(key)) fileMap.set(key, []);
        fileMap.get(key).push(chunk.content);
      }

      const sections = [];
      for (const [key, contents] of fileMap.entries()) {
        const [docName, docType] = key.split("|||");
        sections.push(
          `### ARCHIVO: "${docName}" (${docType})\n${contents.join("\n\n")}`
        );
      }
      contextText = sections.join("\n\n---\n\n");
    }

    // 4.5. Obtener los quizzes del estudiante para esta materia
    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    let quizzesText = "No hay cuestionarios creados para esta materia aún.";
    if (!quizzesError && quizzes && quizzes.length > 0) {
      const formattedQuizzes = quizzes.map((q, qIndex) => {
        let durationMinutes = "-";
        if (q.created_at && q.completed_at) {
          const start = new Date(q.created_at);
          const end = new Date(q.completed_at);
          const diffMs = end - start;
          durationMinutes = Math.round(diffMs / 60000);
        }
        
        let questionsText = "Preguntas y respuestas no disponibles.";
        if (q.questions_json && q.questions_json.length > 0) {
          questionsText = q.questions_json.map((quest, questIdx) => {
            const userAnswerObj = q.user_answers?.find(ans => ans.questionIndex === questIdx);
            const chosenOptionIdx = userAnswerObj?.selectedOption;
            const isCorrect = userAnswerObj?.isCorrect;
            
            const chosenOptionText = chosenOptionIdx !== undefined ? quest.options[chosenOptionIdx] : "Sin responder";
            const correctOptionText = quest.options[quest.correct];
            const resultText = chosenOptionIdx !== undefined ? (isCorrect ? "Correcto ✓" : "Incorrecto ✗") : "Sin responder";
            
            return `  Pregunta ${questIdx + 1}: ${quest.question}
  - Opciones: ${quest.options.map((opt, oIdx) => `[${oIdx}] ${opt}`).join(", ")}
  - Respuesta del estudiante: "${chosenOptionText}" (Opción ${chosenOptionIdx !== undefined ? chosenOptionIdx : "-"}) - ${resultText}
  - Respuesta correcta: "${correctOptionText}" (Opción ${quest.correct})
  - Explicación: ${quest.explanation || "No provista"}`;
          }).join("\n\n");
        }

        return `--- CUESTIONARIO ${qIndex + 1}: "${q.name}" ---
- ID del cuestionario: ${q.id}
- Estado: ${q.completed_at ? "Completado" : "En Proceso"}
- Creado el: ${new Date(q.created_at).toLocaleString()}
- Finalizado el: ${q.completed_at ? new Date(q.completed_at).toLocaleString() : "N/A"}
- Duración: ${durationMinutes} min
- Puntuación obtenida: ${q.score !== null ? `${q.score}%` : "Sin puntuación aún"}
- Preguntas y Desempeño:
${questionsText}`;
      });
      quizzesText = formattedQuizzes.join("\n\n=================================\n\n");
    }

    // 5. System prompt con contexto enriquecido
    const techniqueInstruction =
      STUDY_TECHNIQUES[studyTechnique] || STUDY_TECHNIQUES.neutral;
    const systemInstruction = TUTOR_SYSTEM_PROMPT
      .replace("{context}", contextText)
      .replace("{quizzesContext}", quizzesText)
      .replace("{studyTechnique}", techniqueInstruction);

    // 6. Construir el historial de conversación en el formato de contents de Gemini
    // El frontend envía el historial de mensajes incluyendo el mensaje actual del usuario al final.
    // Filtramos mensajes vacíos (como el placeholder del stream) y mapeamos roles.
    const HISTORY_LIMIT = 20; // Últimos 20 mensajes para acotar el uso de tokens
    const rawHistory = Array.isArray(history) ? history : [];

    const contents = rawHistory
      .filter(msg => msg.content && msg.content.trim() !== "")
      .slice(-HISTORY_LIMIT)
      .map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // Garantizar que el último elemento sea el mensaje actual del usuario
    // (por si el historial llegó incompleto o vacío)
    if (
      contents.length === 0 ||
      contents[contents.length - 1].role !== "user" ||
      contents[contents.length - 1].parts[0].text !== message
    ) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // 7. Generar respuesta en streaming con Gemini usando el historial completo
    const streamResult = await generateChatResponse(contents, systemInstruction, userApiKey);

    // 8. Convertir AsyncGenerator → ReadableStream compatible con Next.js
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("[Chat] Stream error:", err);
          controller.enqueue(encoder.encode(`\n[Error en streaming: ${err.message}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[Chat] Error crítico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ model: CHAT_MODEL });
}
