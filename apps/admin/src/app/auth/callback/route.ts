import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Intercambia el código del enlace mágico / confirmación por una sesión (PKCE). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("El enlace no es válido o venció. Pide uno nuevo.")}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
