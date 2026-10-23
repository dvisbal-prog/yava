import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative h-9 w-9 rounded-lg bg-blue text-white font-black text-lg flex items-center justify-center shrink-0" aria-hidden>
        Y<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-carbon">YAVA</span>
          <span className="block text-[11px] text-muted -mt-0.5">Administración</span>
        </span>
      ) : null}
    </div>
  );
}
