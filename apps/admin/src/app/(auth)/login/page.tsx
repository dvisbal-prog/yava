import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso administrativo" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return <LoginForm next={sp.next ?? "/"} initialError={sp.error ?? null} />;
}
