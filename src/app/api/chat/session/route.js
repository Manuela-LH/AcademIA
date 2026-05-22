import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const { subjectId } = await request.json();
    if (!subjectId) {
      return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Busca en chat_sessions si ya existe una fila con user_id + subject_id
    let { data: session, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("subject_id", subjectId)
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 is "No rows found"
      console.error("Error fetching chat session:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!session) {
      // Si no existe, la crea con time_spent_seconds = 0
      const { data: newSession, error: insertError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          time_spent_seconds: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating chat session:", insertError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      session = newSession;
    }

    return NextResponse.json({ 
      sessionId: session.id, 
      time_spent_seconds: session.time_spent_seconds 
    });

  } catch (error) {
    console.error("Chat session POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { sessionId, timeSpentSeconds } = await request.json();
    if (!sessionId || typeof timeSpentSeconds !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({ 
        time_spent_seconds: timeSpentSeconds,
        ended_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating chat session:", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Chat session PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
