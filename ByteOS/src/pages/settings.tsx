import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { settingsControlDetails, settingsSections } from "@/services/workbench";

export function SettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="grid gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/14 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                {section.controls.map((control, index) => (
                  <div
                    key={control}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{control}</p>
                      <p className="text-xs text-muted-foreground">
                        {settingsControlDetails[control]}
                      </p>
                    </div>
                    <Switch defaultChecked={index === 0} aria-label={control} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <aside className="grid gap-4 self-start">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Palette</Badge>
            <CardTitle>ByteOS Dark</CardTitle>
            <CardDescription>Core colors used across the interface foundation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["#252422", "#403D39", "#FFFCF2", "#CCC5B9", "#EB5E28"].map((color) => (
              <div key={color} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{color}</span>
                <span
                  className="size-9 rounded-xl border border-border shadow-inner shadow-black/20"
                  style={{ backgroundColor: color }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interface Density</CardTitle>
            <CardDescription>Compact controls for repeated daily use on macOS.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-2/3 rounded-full bg-primary" />
            </div>
            <div className="mt-4 flex justify-between text-xs text-muted-foreground">
              <span>Airy</span>
              <span>Balanced</span>
              <span>Dense</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
