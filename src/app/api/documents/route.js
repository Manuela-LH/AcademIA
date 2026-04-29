import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  return NextResponse.json([]);
}
