import { cn } from "@/lib/utils";

export function Card({ className, children, as: Tag = "section" }: { className?: string; children: React.ReactNode; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-lg border border-border bg-card", className)}>{children}</Tag>;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-carbon leading-6">{title}</h2>
        {description ? <p className="text-[13px] text-muted mt-0.5">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

export function Note({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "warning" | "info" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-gray-50 text-gray-700 border-border",
    warning: "bg-yellow-soft text-[#6b4f00] border-[#f5dd8a]",
    info: "bg-blue-soft text-blue-dark border-[#c9d8ff]",
    danger: "bg-red-soft text-red border-[#f5b5b2]",
  } as const;
  return <p className={cn("rounded-md border px-3 py-2 text-[13px] leading-5", tones[tone], className)}>{children}</p>;
}
