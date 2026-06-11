import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContentWithFallback } from "@/lib/gemini/client";
import { QUIZ_GENERATION_PROMPT } from "@/lib/gemini/prompts";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let query = supabase
      .from("quizzes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data: quizzes, error } = await query;

    if (error) throw error;

    const quizzesWithDuration = quizzes.map(q => {
      let durationMinutes = null;
      if (q.time_spent_seconds !== undefined && q.time_spent_seconds !== null && q.time_spent_seconds > 0) {
        durationMinutes = Math.round(q.time_spent_seconds / 60);
      } else if (q.created_at && q.completed_at) {
        const start = new Date(q.created_at);
        const end = new Date(q.completed_at);
        const diffMs = end - start;
        durationMinutes = Math.round(diffMs / 60000);
      }
      return { ...q, duration_minutes: durationMinutes };
    });

    return NextResponse.json(quizzesWithDuration);
  } catch (error) {
    console.error("API Quiz GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { subjectId, timeZone } = await req.json();

    if (!subjectId) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (subjectId)" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userApiKey = user.user_metadata?.gemini_api_key;
    if (!userApiKey) {
      return NextResponse.json({ error: "API Key de Gemini no configurada." }, { status: 400 });
    }

    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("subject_id", subjectId);

    if (chunksError || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: "No hay documentos cargados en esta materia." }, { status: 400 });
    }

    const contextText = chunks.map(c => c.content).join("\n\n---\n\n");
    const prompt = QUIZ_GENERATION_PROMPT.replace("{context}", contextText);

    const response = await generateContentWithFallback(
      prompt,
      { responseMimeType: "application/json" },
      userApiKey
    );

    const responseText = response.text();

    let generatedQuestions;
    try {
      const parsed = JSON.parse(responseText);
      generatedQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : null);
      if (!generatedQuestions) throw new Error("Formato inválido");
    } catch (err) {
      console.error("Error parseando JSON de Gemini:", responseText);
      return NextResponse.json({ error: "La IA no generó un formato JSON válido." }, { status: 500 });
    }

    const now = new Date();
    const tz = timeZone || "UTC";
    const quizName = `Cuestionario - ${now.toLocaleDateString("es-ES", { 
      year: 'numeric', month: 'short', day: 'numeric', timeZone: tz
    })}, ${now.toLocaleTimeString("es-ES", { 
      hour: '2-digit', minute: '2-digit', timeZone: tz
    })}`;

    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        name: quizName,
        questions_json: generatedQuestions,
      })
      .select()
      .single();

    if (quizError) {
      console.error("Error guardando quiz:", quizError);
      return NextResponse.json({ quizId: `temp_${Date.now()}`, questions: generatedQuestions });
    }

    return NextResponse.json({
      quizId: quizData.id,
      name: quizData.name,
      questions: generatedQuestions
    });

  } catch (error) {
    console.error("API Quiz POST Error:", error);
    const isQuota = error.message?.includes("Cuota") || error.message?.includes("429");
    return NextResponse.json(
      { error: isQuota ? error.message : `Error generando cuestionario: ${error.message}` },
      { status: isQuota ? 429 : 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { quizId, userAnswers, score, isFinished, name, timeSpentSeconds } = await req.json();

    if (!quizId) {
      return NextResponse.json({ error: "ID del cuestionario requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("user_id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Cuestionario no encontrado" }, { status: 404 });
    }

    if (quiz.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updateData = {};
    if (userAnswers !== undefined) updateData.user_answers = userAnswers;
    if (score !== undefined) updateData.score = score;
    if (name !== undefined) updateData.name = name;
    if (timeSpentSeconds !== undefined) updateData.time_spent_seconds = timeSpentSeconds;
    
    if (isFinished) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("quizzes")
      .update(updateData)
      .eq("id", quizId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: "Cuestionario actualizado correctamente" });
  } catch (error) {
    console.error("API Quiz PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("id");

    if (!quizId) {
      return NextResponse.json({ error: "ID del cuestionario requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Cuestionario eliminado correctamente" });
  } catch (error) {
    console.error("API Quiz DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}