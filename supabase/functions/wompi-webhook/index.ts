// Webhook de eventos de Wompi (Colombia). Configurar la URL en el panel de Wompi:
// https://<proyecto>.functions.supabase.co/wompi-webhook  · Secreto de eventos en WOMPI_EVENTS_SECRET.
// Verifica la firma (checksum SHA-256 de las propiedades indicadas + timestamp + secreto) y confirma el pago.
import { serviceClient, json } from "../_shared/supabase.ts";

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pick(obj: Record<string, unknown>, path: string): string {
  return String(path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj) ?? "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const secret = Deno.env.get("WOMPI_EVENTS_SECRET");
  const body = await req.json();
  const tx = body?.data?.transaction;
  if (!tx) return json({ error: "sin transacción" }, 400);

  if (secret) {
    const props: string[] = body?.signature?.properties ?? [];
    const concat = props.map((p) => pick(body.data, p)).join("") + String(body.timestamp) + secret;
    const expected = await sha256Hex(concat);
    if (expected !== body?.signature?.checksum) return json({ error: "firma inválida" }, 401);
  }

  const status = tx.status === "APPROVED" ? "paid" : tx.status === "DECLINED" || tx.status === "ERROR" || tx.status === "VOIDED" ? "failed" : "pending";
  const amount = Math.round(Number(tx.amount_in_cents) / 100);
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("confirm_payment", {
    p_order_id: tx.reference, p_provider: "wompi", p_provider_ref: tx.id, p_status: status, p_amount: amount,
    p_gateway_fee: Math.round(amount * 0.0265 + 700), // estimado Wompi: 2,65 % + $700; ajustar con la tarifa contratada
    p_raw: body,
  });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, order: data?.number });
});
