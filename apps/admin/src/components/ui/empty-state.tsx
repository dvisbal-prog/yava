import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <span className="h-11 w-11 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-3" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-carbon">{title}</p>
      {description ? <p className="text-[13px] text-muted mt-1 max-w-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
