import { motion } from "framer-motion";
import { Bell, Command, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commandSuggestions, pageTitles } from "@/services/workbench";
import type { WorkbenchPage } from "@/types/navigation";

type TopCommandBarProps = {
  activePage: WorkbenchPage;
};

export function TopCommandBar({ activePage }: TopCommandBarProps) {
  const page = pageTitles[activePage];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-3 z-30 rounded-2xl border border-border bg-card/78 p-3 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <Badge variant="secondary" className="mb-2">
            <Command className="size-3.5" />
            {page.eyebrow}
          </Badge>
          <h1 className="truncate text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            {page.title}
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 xl:max-w-2xl">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Command search"
              className="h-11 rounded-2xl pl-9"
              placeholder="Search commands, pages, and workspace context"
            />
          </div>
          <Button type="button" variant="secondary" size="icon" aria-label="Filters">
            <SlidersHorizontal />
          </Button>
          <Button type="button" variant="secondary" size="icon" aria-label="Notifications">
            <Bell />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {commandSuggestions.map((item) => {
          const Icon = item.icon;

          return (
            <Badge key={item.label} variant="outline" className="shrink-0">
              <Icon className="size-3.5 text-primary" />
              {item.label}
            </Badge>
          );
        })}
      </div>
    </motion.header>
  );
}
