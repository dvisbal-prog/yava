import type { ReactNode } from "react";
import Link from "next/link";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[15px] leading-7 text-[#1B1F24]">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/legal/terminos" className="text-xl font-extrabold tracking-wide text-[#1E5EFF]">YAVA</Link>
        <nav className="flex gap-4 text-sm text-[#4B5563]">
          <Link href="/legal/terminos" className="hover:text-[#1E5EFF]">Términos</Link>
          <Link href="/legal/privacidad" className="hover:text-[#1E5EFF]">Privacidad</Link>
        </nav>
      </header>
      <article className="prose-headings:font-bold [&_h1]:mb-2 [&_h1]:text-2xl [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_p]:mb-3 [&_li]:ml-5 [&_li]:list-disc">{children}</article>
      <footer className="mt-12 border-t border-[#E5E7EB] pt-4 text-xs text-[#6B7280]">YAVA · Puerto Colombia, Atlántico, Colombia · soporte@yava.app</footer>
    </main>
  );
}
