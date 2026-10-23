import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(admin)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sin acceso" };

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="text-center">
      <span className="mx-auto h-12 w-12 rounded-full bg-red-soft text-red flex items-center justify-center" aria-hidden>
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-bold text-carbon mt-4">Sin acceso al panel</h1>
      <p className="text-sm text-muted mt-2">
        {user?.email ? (
          <>
            La cuenta <strong>{user.email}</strong> no hace parte del equipo administrativo o está deshabilitada.
          </>
        ) : (
          "Tu cuenta no hace parte del equipo administrativo."
        )}{" "}
        El acceso es solo por invitación del owner.
      </p>
      <form action={signOutAction} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Cerrar sesión e ingresar con otra cuenta
        </Button>
      </form>
    </div>
  );
}
