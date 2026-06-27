import { AlertTriangle, CheckCircle2, Radio, Zap } from "lucide-react";
import type { ActivityItem } from "@/types/byteos";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

function iconFor(level: ActivityItem["level"]) {
  if (level === "warn") return <AlertTriangle size={15} className="text-workbench-warn" />;
  if (level === "error") return <AlertTriangle size={15} className="text-workbench-danger" />;
  if (level === "automation") return <Zap size={15} className="text-workbench-blue" />;
  return <CheckCircle2 size={15} className="text-workbench-accent" />;
}

export function ActivityLog({
  activity,
  onClear
}: {
  activity: ActivityItem[];
  onClear: () => void;
}) {
  return (
    <Panel
      title="Activity"
      eyebrow="Runtime"
      action={<Button variant="ghost" onClick={onClear}>Clear</Button>}
      className="min-h-[260px]"
    >
      <div className="grid max-h-[310px] gap-2 overflow-auto pr-1">
        {activity.length === 0 ? (
          <div className="flex items-center gap-2 rounded-workbench border border-dashed border-workbench-line p-4 text-sm text-workbench-muted">
            <Radio size={16} />
            Activity will appear here as the assistant works.
          </div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-workbench border border-workbench-line bg-[#101720] p-3 text-sm">
              <div className="mt-0.5">{iconFor(item.level)}</div>
              <div>
                <p className="text-workbench-text">{item.message}</p>
                <p className="mt-1 text-xs text-workbench-muted">{new Date(item.at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
