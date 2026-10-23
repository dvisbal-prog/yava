import { Redirect } from "expo-router";
import { useEffectiveRole } from "@/store/auth";

export default function Index() {
  const role = useEffectiveRole();
  if (role === "loading") return null;
  if (role === "guest" || role === "customer") return <Redirect href="/(customer)" />;
  return <Redirect href={`/(${role})` as never} />;
}
