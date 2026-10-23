import { Suspense } from "react";
import { getAdminContext } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  const supabase = await createClient();
  const [{ data: cities }, selectedCity] = await Promise.all([
    supabase.from("cities").select("id,name").eq("active", true).order("name"),
    getSelectedCity(),
  ]);

  const today = new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", year: "numeric" });
  const name = ctx.profile?.full_name ?? ctx.email ?? "Equipo YAVA";

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar role={ctx.role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Suspense fallback={<div className="h-16 border-b border-border bg-card" />}>
            <Topbar name={name} role={ctx.role} avatarUrl={ctx.profile?.avatar_url ?? null} cities={cities ?? []} selectedCity={selectedCity} today={today} />
          </Suspense>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-8 max-w-[1440px] w-full mx-auto">{children}</main>
        </div>
        <MobileNav role={ctx.role} />
      </div>
    </ToastProvider>
  );
}
