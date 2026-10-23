// Tareas programadas. Invocar con pg_cron (ver supabase/cron.sql) o un cron externo con header Authorization: Bearer <service_role>.
//   ?job=expire_payments   cada 5 min   → cancela pedidos con pago pendiente > 30 min
//   ?job=owner_alerts      cada 10 min  → alertas de dirección
//   ?job=daily_summary     06:30 Bogotá → resumen diario a owners
import { serviceClient, json } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.endsWith(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__")) return json({ error: "no autorizado" }, 401);
  const job = new URL(req.url).searchParams.get("job");
  const supabase = serviceClient();
  const fn = job === "expire_payments" ? "expire_pending_payments" : job === "owner_alerts" ? "generate_owner_alerts" : job === "daily_summary" ? "owner_daily_summary" : null;
  if (!fn) return json({ error: "job desconocido" }, 400);
  const { data, error } = await supabase.rpc(fn);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, job, result: data });
});
