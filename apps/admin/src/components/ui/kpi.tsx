import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KPI({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "blue" | "green" | "red" | "yellow";
  className?: string;
}) {
  const iconTone = {
    neutral: "bg-gray-100 text-gray-700",
    blue: "bg-blue-soft text-blue",
    green: "bg-green-soft text-green",
    red: "bg-red-soft text-red",
    yellow: "bg-yellow-soft text-[#8a6400]",
  }[tone];
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 flex flex-col gap-2 min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted leading-5">{label}</p>
        {Icon ? (
          <span className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", iconTone)} aria-hidden>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-bold tracking-tight text-carbon truncate">{value}</p>
      {hint ? <div className="text-xs text-muted leading-4">{hint}</div> : null}
    </div>
  );
}

export function StatInline({ label, value, muted = false }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className={cn(muted ? "text-muted" : "text-gray-700")}>{label}</span>
      <span className={cn("font-medium tabular-nums", muted ? "text-muted" : "text-carbon")}>{value}</span>
    </div>
  );
}
