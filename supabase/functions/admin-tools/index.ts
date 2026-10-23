// Herramienta interna de arranque: crea los usuarios demo con la API de administración de Auth.
// Protegida por un token de un solo uso (ver dashboard). Desactivar o redeplegar como no-op tras el seed inicial.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SETUP_TOKEN = Deno.env.get("SETUP_TOKEN") ?? "cambiar-este-token";
const DEMO_USERS = [
  { email: "cliente@yava.app", phone: "+573001110001", name: "María Pérez", role: "customer" },
  { email: "comercio@yava.app", phone: "+573001110002", name: "Juan Bocamar", role: "merchant" },
  { email: "repartidor@yava.app", phone: "+573001110003", name: "Carlos Rodríguez", role: "courier" },
  { email: "owner@yava.app", phone: "+573001110004", name: "Laura Owner", role: "admin" },
  { email: "finanzas@yava.app", phone: "+573001110005", name: "Andrés Finanzas", role: "admin" },
  { email: "cliente2@yava.app", phone: "+573001110006", name: "Ana López", role: "customer" },
  { email: "naranmiche@yava.app", phone: "+573001110007", name: "Pedro Naranmiche", role: "merchant" },
  { email: "amaras@yava.app", phone: "+573001110008", name: "Samir Amaras", role: "merchant" },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  if (body?.token !== SETUP_TOKEN) return json({ error: "no autorizado" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const out: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email, phone: u.phone, password: body?.password ?? "yava2026", email_confirm: true, phone_confirm: true,
      user_metadata: { full_name: u.name, role: u.role },
    });
    out[u.email] = error ? `ERROR: ${error.message}` : data.user?.id ?? "?";
  }
  return json({ ok: true, users: out });
});
