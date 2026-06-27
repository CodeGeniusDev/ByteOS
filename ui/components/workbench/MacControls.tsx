"use client";

import { useState } from "react";
import { AppWindow, Camera, Eye, Globe, Keyboard, Search, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/FormControls";
import { Panel } from "@/components/ui/Panel";

export function MacControls({
  onRunAction
}: {
  onRunAction: (action: string, value?: string) => void;
}) {
  const [appName, setAppName] = useState("Safari");
  const [url, setUrl] = useState("apple.com");
  const [text, setText] = useState("");
  const [spotlight, setSpotlight] = useState("calculator");

  return (
    <div className="grid gap-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-5">
        <Panel title="Apps" eyebrow="Launch and Manage">
          <div className="grid gap-3">
            <Field label="Application name">
              <Input value={appName} onChange={(event) => setAppName(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button variant="primary" icon={<AppWindow size={16} />} onClick={() => onRunAction("open-app", appName)}>Open</Button>
              <Button onClick={() => onRunAction("quit-app", appName)}>Quit</Button>
              <Button variant="ghost" onClick={() => onRunAction("active-app")}>Active App</Button>
              <Button variant="ghost" onClick={() => onRunAction("list-apps")}>List Apps</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Web" eyebrow="Browser">
          <div className="grid gap-3">
            <Field label="Website">
              <Input value={url} onChange={(event) => setUrl(event.target.value)} />
            </Field>
            <Button variant="primary" icon={<Globe size={16} />} onClick={() => onRunAction("open-url", url)}>
              Open Website
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="Active App Input" eyebrow="Control">
          <div className="grid gap-3">
            <Field label="Text to type">
              <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Text for active app" />
            </Field>
            <div className="flex gap-2">
              <Button variant="primary" icon={<Keyboard size={16} />} onClick={() => onRunAction("type", text)}>Type</Button>
              <Button icon={<Volume2 size={16} />} onClick={() => onRunAction("speak", text)}>Speak</Button>
              <Button onClick={() => onRunAction("copy", text)}>Copy</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Spotlight" eyebrow="Search">
          <div className="grid gap-3">
            <Field label="Search query">
              <Input value={spotlight} onChange={(event) => setSpotlight(event.target.value)} />
            </Field>
            <Button variant="primary" icon={<Search size={16} />} onClick={() => onRunAction("spotlight", spotlight)}>
              Search Spotlight
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="Screen Intelligence" eyebrow="Vision">
        <div className="flex flex-wrap gap-3">
          <Button icon={<Camera size={16} />} onClick={() => onRunAction("screenshot")}>Save Screenshot</Button>
          <Button variant="primary" icon={<Eye size={16} />} onClick={() => onRunAction("see-screen")}>Ask AI What I See</Button>
        </div>
        <p className="mt-3 text-sm text-workbench-muted">
          Screen controls require macOS Screen Recording permission for ByteOS, Electron, or Terminal.
        </p>
      </Panel>
    </div>
  );
}
