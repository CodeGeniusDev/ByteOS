import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 rounded-2xl border border-white/10 bg-[#101720] px-3 text-sm text-workbench-text placeholder:text-workbench-muted",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 resize-y rounded-2xl border border-white/10 bg-[#101720] px-3 py-2 text-sm text-workbench-text placeholder:text-workbench-muted",
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 rounded-2xl border border-white/10 bg-[#101720] px-3 text-sm text-workbench-text",
        className
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-workbench-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}
