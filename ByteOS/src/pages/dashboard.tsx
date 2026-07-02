import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activityItems, dashboardCards, systemMetrics } from "@/services/workbench";

export function DashboardPage() {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <Badge className="w-fit">
              <CheckCircle2 className="size-3.5" />
              Phases 1-4
            </Badge>
            <CardTitle className="text-3xl sm:text-4xl">Premium macOS workbench foundation</CardTitle>
            <CardDescription className="max-w-2xl">
              A focused desktop surface with navigation, glass panels, command access, and
              responsive page regions for the ByteOS assistant experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {systemMetrics.map((metric, index) => {
                const Icon = metric.icon;

                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className="rounded-2xl border border-border bg-secondary/70 p-4"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <Icon className="size-5 text-primary" />
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-normal">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Map</CardTitle>
            <CardDescription>Core surfaces currently available in the ByteOS workbench.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboardCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-muted/65 p-4 transition-colors hover:bg-secondary"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-primary/14 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activityItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="bg-card/62">
              <CardContent className="p-4">
                <Icon className="mb-5 size-5 text-primary" />
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
