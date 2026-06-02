import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  TOPIC_LABELS,
  type Settings,
  type Topic,
} from "@/lib/maths";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Maths 4 in One" },
      { name: "description", content: "Choose which maths topics appear in your practice tests." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function toggle(t: Topic, v: boolean) {
    update({ ...settings, topics: { ...settings.topics, [t]: v } });
  }

  const basic: Topic[] = ["add", "subtract", "multiply", "divide"];
  const advanced: Topic[] = ["squares", "sqrt", "powers", "pythagoras", "percentages"];

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Pick which topics show up in your tests.</p>
        </header>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Basic arithmetic</h2>
          <div className="space-y-3">
            {basic.map((t) => (
              <Row key={t} t={t} on={settings.topics[t]} onChange={(v) => toggle(t, v)} />
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Advanced topics</h2>
          <div className="space-y-3">
            {advanced.map((t) => (
              <Row key={t} t={t} on={settings.topics[t]} onChange={(v) => toggle(t, v)} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Answers for Pythagoras and percentages accept 2 decimal places.
          </p>
        </Card>

        <Button variant="outline" className="w-full" onClick={() => update(DEFAULT_SETTINGS)}>
          Reset to defaults
        </Button>
      </div>
    </main>
  );
}

function Row({ t, on, onChange }: { t: Topic; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={`t-${t}`} className="cursor-pointer">{TOPIC_LABELS[t]}</Label>
      <Switch id={`t-${t}`} checked={on} onCheckedChange={onChange} />
    </div>
  );
}
