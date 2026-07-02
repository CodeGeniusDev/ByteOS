import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full resize-none rounded-2xl border border-input bg-muted/80 px-4 py-3 text-sm leading-6 text-foreground shadow-inner shadow-black/10 transition-colors placeholder:text-muted-foreground/80 focus:border-primary/55 focus:bg-secondary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
