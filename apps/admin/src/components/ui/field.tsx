import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border border-border bg-card px-3 text-sm text-carbon placeholder:text-gray-400 focus:border-blue disabled:bg-gray-50 disabled:text-gray-500";

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-[13px] font-medium text-gray-700 mb-1", className)}>
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, "h-10 pr-8 appearance-none bg-no-repeat bg-[right_0.6rem_center]", className)} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")" }} {...props}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "py-2 min-h-[88px] resize-y", className)} {...props} />;
});

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={props.id ?? id} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input id={props.id ?? id} type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-[var(--yv-blue)]" {...props} />
      {label}
    </label>
  );
}
