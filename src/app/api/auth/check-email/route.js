import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const exists = data.users.some(user => user.email?.toLowerCase() === email.toLowerCase());

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("check-email API error:", error);
    return NextResponse.json({ error: "Error al verificar el correo" }, { status: 500 });
  }
}
