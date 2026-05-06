export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatResponse } from "@/lib/gemini/client";
import { TUTOR_SYSTEM_PROMPT, STUDY_TECHNIQUES } from "@/lib/gemini/prompts";

export async function POST(req) {
  try {
    const { message, subjectId, studyTechnique = "neutral" } = await req.json();

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

    // 5. System prompt con contexto enriquecido
    const techniqueInstruction =
      STUDY_TECHNIQUES[studyTechnique] || STUDY_TECHNIQUES.neutral;
    const systemInstruction = TUTOR_SYSTEM_PROMPT
      .replace("{context}", contextText)
      .replace("{studyTechnique}", techniqueInstruction);

    // 6. Generar respuesta en streaming con Gemini
    const streamResult = await generateChatResponse(message, systemInstruction, userApiKey);

    // 7. Convertir AsyncGenerator → ReadableStream compatible con Next.js
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
