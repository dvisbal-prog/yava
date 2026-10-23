import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue text-white hover:bg-blue-dark",
  secondary: "bg-blue-soft text-blue hover:bg-[#d9e4ff]",
  outline: "border border-border bg-card text-carbon hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "bg-red text-white hover:bg-[#c92823]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
  prefetch,
}: {
  href: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  prefetch?: boolean;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
