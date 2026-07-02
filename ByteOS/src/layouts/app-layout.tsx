import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/workbench/sidebar";
import { MobileNav } from "@/components/workbench/mobile-nav";
import { TopCommandBar } from "@/components/workbench/top-command-bar";
import type { WorkbenchPage } from "@/types/navigation";

type AppLayoutProps = {
  activePage: WorkbenchPage;
  onPageChange: (page: WorkbenchPage) => void;
  children: React.ReactNode;
};

export function AppLayout({ activePage, onPageChange, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background px-3 py-3 text-foreground sm:px-4">
      <div className="mx-auto grid max-w-[1560px] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <Sidebar activePage={activePage} onPageChange={onPageChange} />
        </div>

        <main className="min-w-0 pb-20 lg:pb-0">
          <TopCommandBar activePage={activePage} />
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="mt-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav activePage={activePage} onPageChange={onPageChange} />
    </div>
  );
}
