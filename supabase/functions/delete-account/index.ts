// Eliminación de cuenta (App Store / Google Play). La app la invoca con el JWT del usuario:
//   supabase.functions.invoke('delete-account')
// 1) anonimiza datos públicos vía RPC anonymize_account  2) borra datos personales  3) bloquea y limpia el usuario en Auth.
import { createClient } from "jsr:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: uerr } = await asUser.auth.getUser();
  if (uerr || !user) return json({ error: "No autenticado" }, 401);
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  const { error: rpcErr } = await admin.rpc("anonymize_account", { p_uid: user.id });
  if (rpcErr) return json({ error: rpcErr.message }, 400);
  for (const t of ["addresses", "payment_methods", "device_tokens", "favorites", "notifications"]) {
    await admin.from(t).delete().eq("user_id", user.id);
  }
  await admin.from("courier_documents").delete().eq("courier_id", user.id);
  const { error: banErr } = await admin.auth.admin.updateUserById(user.id, {
    email: `eliminado+${user.id}@yava.invalid`, phone: undefined, email_confirm: true,
    user_metadata: {}, ban_duration: "876000h",
  });
  if (banErr) return json({ error: banErr.message }, 400);
  return json({ ok: true });
});
