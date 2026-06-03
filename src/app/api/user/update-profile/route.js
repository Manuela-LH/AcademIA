import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, password } = body;

    if (!fullName && !password) {
      return NextResponse.json({ error: "No hay cambios que guardar." }, { status: 400 });
    }

    const updatePayload = {};

    if (fullName && fullName.trim()) {
      updatePayload.data = { full_name: fullName.trim() };
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
      }
      updatePayload.password = password;
    }

    const { error: updateError } = await supabase.auth.updateUser(updatePayload);

    if (updateError) {
      console.error("[update-profile] Error:", updateError.message);
      return NextResponse.json({ error: "Error al actualizar el perfil: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Perfil actualizado correctamente." });
  } catch (error) {
    console.error("[update-profile] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
