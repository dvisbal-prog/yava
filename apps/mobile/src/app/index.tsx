import { Redirect } from "expo-router";
import { useEffectiveRole } from "@/store/auth";
import { useAccess } from "@/store/access";

/** Entrada: 01 es el splash nativo. Un invitado que no ha visto el acceso (02) va a login; el resto, a su grupo. */
export default function Index() {
  const role = useEffectiveRole();
  const hydrated = useAccess((s) => s.hydrated);
  const seenAccess = useAccess((s) => s.seenAccess);
  if (role === "loading" || !hydrated) return null;
  if (role === "guest") return <Redirect href={seenAccess ? "/(customer)" : "/(auth)/login"} />;
  if (role === "customer") return <Redirect href="/(customer)" />;
  return <Redirect href={`/(${role})` as never} />;
}
