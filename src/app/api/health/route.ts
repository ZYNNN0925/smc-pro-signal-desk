import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase-admin";
import { hasSupabaseAuthConfig } from "@/lib/supabase/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "SMC PRO Signal Desk",
    authConfigured: hasSupabaseAuthConfig(),
    supabaseConfigured: hasSupabaseConfig(),
    timestamp: new Date().toISOString(),
  });
}
