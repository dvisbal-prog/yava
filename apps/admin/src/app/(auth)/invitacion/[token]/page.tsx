import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InvitationForm } from "./invitation-form";

export const metadata: Metadata = { title: "Invitación al equipo" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <InvitationForm token={token} sessionEmail={user?.email ?? null} />;
}
