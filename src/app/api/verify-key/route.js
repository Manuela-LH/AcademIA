import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApiKey } from "@/lib/gemini/client";

export async function POST(req) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "La API Key es requerida." }, { status: 400 });
    }

    // 1. Autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Verificar que la API Key de Gemini funciona
    try {
      await validateApiKey(apiKey);
    } catch (e) {
      console.error("[Verify-Key] Error verificando la key:", e.message);
      return NextResponse.json({ 
        error: "La API Key ingresada no es válida o no tiene permisos. Por favor, revísala." 
      }, { status: 400 });
    }

    // 3. Si es válida, guardarla en user_metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { gemini_api_key: apiKey }
    });

    if (updateError) {
      console.error("[Verify-Key] Error guardando la key en Auth:", updateError.message);
      return NextResponse.json({ error: "Error al guardar la configuración." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "API Key guardada correctamente." });

  } catch (error) {
    console.error("Verify Key Error:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
