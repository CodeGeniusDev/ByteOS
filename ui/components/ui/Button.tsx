import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "secondary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-[0_12px_34px_rgba(103,232,249,.18)] hover:bg-cyan-200",
        variant === "secondary" && "border-white/10 bg-white/[0.06] text-workbench-text hover:border-cyan-300/40 hover:bg-white/[0.09]",
        variant === "ghost" && "border-transparent bg-transparent text-workbench-muted hover:border-white/10 hover:bg-white/[0.04] hover:text-workbench-text",
        variant === "danger" && "border-rose-400/30 bg-transparent text-rose-300 hover:bg-rose-400/10",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
