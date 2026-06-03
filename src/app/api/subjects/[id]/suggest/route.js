import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContentWithFallback } from "@/lib/gemini/client";
import { getSuggestionPrompt } from "@/lib/gemini/prompts";

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  if (seconds < 60) return "< 1 min";
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export async function POST(req, { params }) {
  try {
    const { id: subjectId } = await params;

    if (!subjectId) {
      return NextResponse.json({ error: "ID de materia requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userApiKey = user.user_metadata?.gemini_api_key;
    if (!userApiKey) {
      return NextResponse.json(
        { error: "API Key de Gemini no configurada. Configúrala en la sección de ajustes." },
        { status: 400 }
      );
    }

    // 1. Obtener la materia
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name, suggestion, suggestion_updated_at")
      .eq("id", subjectId)
      .eq("user_id", user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json({ error: "Materia no encontrada o no autorizada" }, { status: 404 });
    }

    // 2. Obtener métricas de la materia:
    // a. Quizzes (score, completados, aciertos/errores, tiempo de estudio)
    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select("name, score, completed_at, questions_json, user_answers, time_spent_seconds")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id);

    if (quizzesError) {
      console.error("Error fetching quizzes metrics:", quizzesError);
    }

    // b. Tiempo de estudio en Chat Sessions
    const { data: chatSessions, error: chatSessionsError } = await supabase
      .from("chat_sessions")
      .select("time_spent_seconds")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id);

    if (chatSessionsError) {
      console.error("Error fetching chat sessions metrics:", chatSessionsError);
    }

    // c. Documentos cargados
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("name, file_type, size_bytes")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id);

    if (docsError) {
      console.error("Error fetching documents metrics:", docsError);
    }

    // Calcular estadísticas resumidas
    const totalQuizzes = quizzes ? quizzes.length : 0;
    const completedQuizzesList = quizzes ? quizzes.filter(q => q.completed_at) : [];
    const completedQuizzes = completedQuizzesList.length;
    const quizzesWithScore = quizzes ? quizzes.filter(q => q.score != null) : [];
    const sumScore = quizzesWithScore.reduce((acc, q) => acc + Number(q.score), 0);
    const averageScore = quizzesWithScore.length > 0 ? (sumScore / quizzesWithScore.length).toFixed(1) : "0.0";

    let totalCorrect = 0;
    let totalIncorrect = 0;
    if (quizzes) {
      quizzes.forEach(q => {
        if (Array.isArray(q.user_answers) && q.user_answers.length > 0) {
          q.user_answers.forEach(ans => {
            if (ans.isCorrect) totalCorrect++; else totalIncorrect++;
          });
        } else if (q.completed_at && q.score !== null && Array.isArray(q.questions_json)) {
          const n = q.questions_json.length;
          const c = Math.round((Number(q.score) / 100) * n);
          totalCorrect += c;
          totalIncorrect += n - c;
        }
      });
    }

    const totalQA = totalCorrect + totalIncorrect;
    const correctPct = totalQA > 0 ? Math.round((totalCorrect / totalQA) * 100) : 0;

    const totalChatTime = chatSessions ? chatSessions.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0) : 0;
    const totalQuizTime = quizzes ? quizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0) : 0;
    const totalStudyTimeSeconds = totalChatTime + totalQuizTime;

    const documentListString = documents && documents.length > 0 
      ? documents.map(d => `${d.name} (${d.file_type || "desconocido"})`).join(", ")
      : "Ninguno";

    // 3. Construir prompt para Gemini
    const prompt = getSuggestionPrompt({
      subjectName: subject.name,
      completedQuizzes,
      totalQuizzes,
      averageScore,
      totalCorrect,
      totalIncorrect,
      correctPct,
      formattedStudyTime: formatTime(totalStudyTimeSeconds),
      documentsCount: documents ? documents.length : 0,
      documentListString,
      quizzes,
      previousSuggestion: subject.suggestion,
      previousUpdatedAt: subject.suggestion_updated_at
    });

    // 4. Llamar a Gemini
    const response = await generateContentWithFallback(
      prompt,
      {},
      userApiKey
    );

    const suggestionText = response.text().trim();
    const now = new Date().toISOString();

    // 5. Sobrescribir suggestion y suggestion_updated_at en la materia
    const { data: updatedSubject, error: updateError } = await supabase
      .from("subjects")
      .update({
        suggestion: suggestionText,
        suggestion_updated_at: now
      })
      .eq("id", subjectId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 6. Devolver { suggestion, updatedAt }
    return NextResponse.json({
      suggestion: updatedSubject.suggestion,
      updatedAt: updatedSubject.suggestion_updated_at
    });

  } catch (error) {
    console.error("API Suggestion POST Error:", error);
    const isQuota = error.message?.includes("Cuota") || error.message?.includes("429");
    return NextResponse.json(
      { error: isQuota ? "Límite de cuota de Gemini alcanzado. Intenta de nuevo más tarde." : `Error al generar sugerencia: ${error.message}` },
      { status: isQuota ? 429 : 500 }
    );
  }
}
