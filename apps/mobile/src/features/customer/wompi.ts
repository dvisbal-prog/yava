import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

export const WOMPI_PUBLIC_KEY = process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY ?? "";

/** Construye la URL del checkout web de Wompi para un pedido (referencia = id del pedido). */
export function wompiCheckoutUrl(orderId: string, amount: number): string {
  const redirect = Linking.createURL(`order/${orderId}/confirmed`);
  const params = new URLSearchParams({
    "public-key": WOMPI_PUBLIC_KEY, currency: "COP", "amount-in-cents": String(Math.round(amount * 100)), reference: orderId, "redirect-url": redirect,
  });
  // TODO(wompi): agregar `signature:integrity` (SHA-256 de reference+amount+currency+secreto de integridad) generada en una Edge Function.
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

/** Abre el checkout de Wompi y espera el regreso por deep link (yava://order/<id>/confirmed). */
export async function openWompi(orderId: string, amount: number): Promise<void> {
  const redirect = Linking.createURL(`order/${orderId}/confirmed`);
  await WebBrowser.openAuthSessionAsync(wompiCheckoutUrl(orderId, amount), redirect);
}
