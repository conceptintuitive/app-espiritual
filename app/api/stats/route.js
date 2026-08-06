import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ count: null });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { count, error } = await supabase
      .from("analises")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ count: count ?? null });
  } catch (error) {
    console.error("❌ Erro ao buscar stats:", error);
    return NextResponse.json({ count: null });
  }
}
