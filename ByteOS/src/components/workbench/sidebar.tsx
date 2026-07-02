import { motion } from "framer-motion";
import { Bot, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/services/workbench";
import type { WorkbenchPage } from "@/types/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activePage: WorkbenchPage;
  onPageChange: (page: WorkbenchPage) => void;
};

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-4 z-20 flex h-[calc(100vh-2rem)] w-full flex-col rounded-2xl border border-border bg-card/72 p-3 shadow-[0_26px_90px_rgba(0,0,0,.34)] backdrop-blur-2xl lg:w-72"
    >
      <div className="flex items-center gap-3 border-b border-border px-2 pb-4">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_36px_rgba(235,94,40,.24)]">
          <Bot size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-normal">ByteOS</p>
          <p className="truncate text-xs text-muted-foreground">macOS AI Workbench</p>
        </div>
      </div>

      <nav className="mt-4 grid gap-1.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activePage;

          return (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              className={cn(
                "h-11 justify-start rounded-xl px-3 text-sm",
                isActive
                  ? "bg-primary/16 text-primary hover:bg-primary/18 hover:text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
              {isActive ? <Circle className="ml-auto size-2 fill-primary text-primary" /> : null}
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border bg-secondary/75 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          Workbench Mode
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          A focused UI shell for local-first assistant workflows.
        </p>
      </div>
    </motion.aside>
  );
}
