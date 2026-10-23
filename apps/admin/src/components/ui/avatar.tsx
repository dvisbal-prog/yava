import { cn, initials } from "@/lib/utils";

export function Avatar({ name, src, size = "md", className }: { name: string | null | undefined; src?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const sz = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-14 w-14 text-base" }[size];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} className={cn("rounded-full object-cover shrink-0", sz, className)} />;
  }
  return (
    <span className={cn("rounded-full bg-blue-soft text-blue font-semibold flex items-center justify-center shrink-0", sz, className)} aria-hidden>
      {initials(name)}
    </span>
  );
}
