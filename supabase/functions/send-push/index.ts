// Envía notificaciones push (Expo Push API) cuando se inserta una fila en `notifications`.
// La llama el trigger notifications_send_push (migración 0012) con el header x-yava-hook (secreto en Vault),
// o cualquier llamada con Authorization: Bearer <service_role>.
import { serviceClient, json } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const supabase = serviceClient();
  const auth = req.headers.get("authorization") ?? "";
  const hook = req.headers.get("x-yava-hook");
  let allowed = auth.endsWith(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__");
  if (!allowed && hook) {
    const { data } = await supabase.rpc("internal_hook_secret_ok", { p_secret: hook });
    allowed = data === true;
  }
  if (!allowed) return json({ error: "no autorizado" }, 401);
  const payload = await req.json();
  const row = payload?.record;
  if (!row?.user_id) return json({ ok: true, skipped: true });

  const [{ data: tokens }, { data: profile }] = await Promise.all([
    supabase.from("device_tokens").select("token").eq("user_id", row.user_id),
    supabase.from("profiles").select("notifications_enabled").eq("id", row.user_id).maybeSingle(),
  ]);
  if (!tokens?.length || profile?.notifications_enabled === false) return json({ ok: true, sent: 0 });

  const messages = tokens.map((t) => ({ to: t.token, sound: "default", title: row.title, body: row.body ?? "", data: row.data ?? {}, channelId: "default" }));
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(messages),
  });
  const out = await res.json();
  // Limpiar tokens inválidos
  const bad: string[] = [];
  (out?.data ?? []).forEach((r: { status: string; details?: { error?: string } }, i: number) => {
    if (r.status === "error" && r.details?.error === "DeviceNotRegistered") bad.push(tokens[i].token);
  });
  if (bad.length) await supabase.from("device_tokens").delete().in("token", bad);
  return json({ ok: true, sent: messages.length - bad.length });
});
