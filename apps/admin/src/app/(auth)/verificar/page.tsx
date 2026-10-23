import type { Metadata } from "next";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verifica tu acceso" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string; recover?: string }> }) {
  const sp = await searchParams;
  return <VerifyForm email={sp.email ?? ""} next={sp.next ?? "/"} recover={sp.recover === "1"} />;
}
