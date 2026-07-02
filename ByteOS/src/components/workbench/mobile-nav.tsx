import { motion } from "framer-motion";
import { navigationItems } from "@/services/workbench";
import type { WorkbenchPage } from "@/types/navigation";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  activePage: WorkbenchPage;
  onPageChange: (page: WorkbenchPage) => void;
};

export function MobileNav({ activePage, onPageChange }: MobileNavProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl border border-border bg-card/85 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:hidden"
      aria-label="Primary navigation"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activePage;

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-12 items-center justify-center rounded-xl text-muted-foreground transition-colors",
              isActive && "bg-primary/16 text-primary",
            )}
            onClick={() => onPageChange(item.id)}
            aria-label={item.label}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </motion.nav>
  );
}
