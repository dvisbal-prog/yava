import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">{children}</div>
        <p className="text-center text-xs text-gray-400 mt-6">Acceso privado · Solo por invitación · YAVA</p>
      </div>
    </div>
  );
}
