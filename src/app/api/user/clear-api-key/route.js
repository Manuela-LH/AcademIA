import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Clear the gemini_api_key by setting it to null in user_metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { gemini_api_key: null }
    });

    if (updateError) {
      console.error("[clear-api-key] Error:", updateError.message);
      return NextResponse.json({ error: "Error al borrar la API Key." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "API Key eliminada correctamente." });
  } catch (error) {
    console.error("[clear-api-key] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
