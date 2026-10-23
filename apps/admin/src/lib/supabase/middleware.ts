import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@yava/shared";
import { env } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/verificar", "/invitacion", "/auth", "/sin-acceso"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Refresca la sesión (patrón oficial getAll/setAll) y protege las rutas del panel. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // No ejecutar lógica entre createServerClient y getUser: evita cierres de sesión aleatorios.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPublic(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" || pathname === "/verificar") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) return supabaseResponse;

  // Solo integrantes activos de admin_users entran al panel.
  const { data: role } = await supabase.rpc("current_admin_role");
  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/sin-acceso";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
