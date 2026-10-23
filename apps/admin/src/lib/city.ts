import { cookies } from "next/headers";

export const CITY_COOKIE = "yava_city";

/** Ciudad seleccionada en la barra superior (cookie). `null` = todas las ciudades. */
export async function getSelectedCity(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(CITY_COOKIE)?.value;
  return v && v !== "all" ? v : null;
}
