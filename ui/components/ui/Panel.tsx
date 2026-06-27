import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-workbench border border-workbench-line bg-workbench-panel p-4 shadow-soft", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-workbench-muted">{eyebrow}</p>}
            {title && <h3 className="text-base font-semibold text-workbench-text">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
