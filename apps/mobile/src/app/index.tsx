import { Redirect } from "expo-router";
import { useEffectiveRole } from "@/store/auth";
import { useAccess } from "@/store/access";
import { Apertura } from "@/components/customer/auth/Apertura";

/**
 * Entrada. 01 · Apertura (logo centrado) se ve tras el splash nativo mientras carga la sesión.
 * Un invitado que no ha visto el acceso (02) va a login; el resto, a su grupo.
 */
export default function Index() {
  const role = useEffectiveRole();
  const hydrated = useAccess((s) => s.hydrated);
  const seenAccess = useAccess((s) => s.seenAccess);
  if (role === "loading" || !hydrated) return <Apertura />;
  if (role === "guest") return <Redirect href={seenAccess ? "/(customer)" : "/(auth)/login"} />;
  if (role === "customer") return <Redirect href="/(customer)" />;
  return <Redirect href={`/(${role})` as never} />;
}
