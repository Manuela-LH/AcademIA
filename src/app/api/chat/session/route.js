import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getUtcBoundsForTimezone(timeZone) {
  let userTimeZone = timeZone || "UTC";
  const now = new Date();
  let parts;
  
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    }).formatToParts(now);
  } catch (e) {
    console.error(`[Session] Invalid timezone "${timeZone}", falling back to UTC:`, e);
    userTimeZone = "UTC";
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    }).formatToParts(now);
  }
  
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value.padStart(2, "0");
  const d = parts.find(p => p.type === "day").value.padStart(2, "0");
  const hr = parts.find(p => p.type === "hour").value.padStart(2, "0");
  const min = parts.find(p => p.type === "minute").value.padStart(2, "0");
  const sec = parts.find(p => p.type === "second").value.padStart(2, "0");
  
  const localAsUtc = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hr), parseInt(min), parseInt(sec));
  const offsetMs = localAsUtc - now.getTime();
  
  const localStartUtc = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0);
  const todayStart = new Date(localStartUtc - offsetMs);
  
  const localEndUtc = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 23, 59, 59, 999);
  const todayEnd = new Date(localEndUtc - offsetMs);
  
  return { todayStart, todayEnd };
}

export async function POST(request) {
  try {
    const { subjectId, timeZone } = await request.json();
    if (!subjectId) {
      return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calcula el rango del día actual del usuario en UTC
    const { todayStart, todayEnd } = getUtcBoundsForTimezone(timeZone);

    // Busca en chat_sessions si ya existe una fila para hoy con user_id + subject_id
    let { data: session, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("subject_id", subjectId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // Usamos maybeSingle para evitar el código de error PGRST116 cuando no hay filas

    if (fetchError) {
      console.error("Error fetching chat session:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!session) {
      // Si no existe para hoy, la crea con time_spent_seconds = 0
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
