import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ALL_TOPICS,
  checkAnswer,
  loadFlags,
  loadSettings,
  makeQuestion,
  saveFlags,
  TOPIC_LABELS,
  type Difficulty,
  type Question,
  type Topic,
} from "@/lib/maths";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maths 4 in One" },
      { name: "description", content: "Practice arithmetic and advanced maths with custom mock tests." },
    ],
  }),
  component: Index,
});

type Mode = "normal" | "flagged";

interface Attempt {
  question: Question;
  given: string;
  correct: boolean;
}

function Index() {
  const [stage, setStage] = useState<"setup" | "quiz" | "results">("setup");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("normal");
  const [randomTopics, setRandomTopics] = useState(false);
  const [testTopics, setTestTopics] = useState<Topic[]>([]);

  const [enabledTopics, setEnabledTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [flagged, setFlagged] = useState<Question[]>([]);

  useEffect(() => {
    setFlagged(loadFlags());
    const s = loadSettings();
    setEnabledTopics((Object.keys(s.topics) as Topic[]).filter((t) => s.topics[t]));
  }, []);

  // refresh settings whenever returning to setup
  useEffect(() => {
    if (stage === "setup") {
      const s = loadSettings();
      setEnabledTopics((Object.keys(s.topics) as Topic[]).filter((t) => s.topics[t]));
    }
  }, [stage]);

  const topicsLabel = useMemo(
    () => testTopics.map((t) => TOPIC_LABELS[t]).join(", "),
    [testTopics],
  );

  function pickRandomTopics(): Topic[] {
    const count = randInt(2, 5);
    const shuffled = [...ALL_TOPICS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function start() {
    let qs: Question[] = [];
    let activeTopics: Topic[] = [];
    if (mode === "flagged") {
      if (flagged.length === 0) return;
      const pool = [...flagged];
      for (let i = 0; i < count; i++) qs.push(pool[i % pool.length]);
      activeTopics = Array.from(new Set(qs.map((q) => q.topic)));
    } else {
      activeTopics = randomTopics ? pickRandomTopics() : enabledTopics;
      if (activeTopics.length === 0) return;
      for (let i = 0; i < count; i++) qs.push(makeQuestion(activeTopics, difficulty));
    }
    setTestTopics(activeTopics);
    setQuestions(qs);
    setAttempts([]);
    setIdx(0);
    setInput("");
    setStage("quiz");
  }

  function submit() {
    if (input.trim() === "") return;
    const q = questions[idx];
    const given = input.trim();
    const correct = checkAnswer(given, q);
    const nextAttempts = [...attempts, { question: q, given, correct }];
    setAttempts(nextAttempts);
    setInput("");
    if (idx + 1 >= questions.length) {
      const wrong = nextAttempts.filter((a) => !a.correct).map((a) => a.question);
      const dedup = new Map<string, Question>();
      [...flagged, ...wrong].forEach((q) => dedup.set(`${q.topic}|${q.prompt}`, q));
      const newFlags = Array.from(dedup.values());
      setFlagged(newFlags);
      saveFlags(newFlags);
      setStage("results");
    } else {
      setIdx(idx + 1);
    }
  }

  function clearFlags() {
    setFlagged([]);
    saveFlags([]);
  }

  if (stage === "setup") {
    return (
      <div className="px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Maths 4 in One</h1>
            <p className="mt-2 text-muted-foreground">Build your own mock test.</p>
          </header>

          <Card className="space-y-6 p-6">
            <div className="space-y-2">
              <Label>Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid grid-cols-2 gap-2">
                <Label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-primary">
                  <RadioGroupItem value="normal" /> Normal mock test
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-primary">
                  <RadioGroupItem value="flagged" /> Flagged mock test
                </Label>
              </RadioGroup>
              {mode === "flagged" && (
                <p className="text-sm text-muted-foreground">
                  {flagged.length} flagged question{flagged.length === 1 ? "" : "s"} available.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Number of questions</Label>
                <span className="text-sm font-medium">{count}</span>
              </div>
              <Slider min={10} max={50} step={1} value={[count]} onValueChange={(v) => setCount(v[0])} />
            </div>

            {mode === "normal" && (
              <>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="random-topics"
                      checked={randomTopics}
                      onCheckedChange={(v) => setRandomTopics(v === true)}
                    />
                    <Label htmlFor="random-topics" className="cursor-pointer text-sm font-medium">
                      Random topics
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pick a surprise mix of topics instead of using your settings.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Active topics</Label>
                  {randomTopics ? (
                    <p className="text-sm text-muted-foreground">A random mix will be chosen when you start.</p>
                  ) : enabledTopics.length === 0 ? (
                    <p className="text-sm text-destructive">
                      No topics enabled.{" "}
                      <Link to="/settings" className="underline">Open settings</Link> to pick some.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{topicsLabel}</p>
                  )}
                  {!randomTopics && (
                    <p className="text-xs text-muted-foreground">
                      Change topics in <Link to="/settings" className="underline">Settings</Link>.
                    </p>
                  )}
                </div>
              </>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={start}
              disabled={(mode === "normal" && enabledTopics.length === 0) || (mode === "flagged" && flagged.length === 0)}
            >
              Start test
            </Button>

            {flagged.length > 0 && (
              <Button variant="ghost" className="w-full" onClick={clearFlags}>
                Clear flagged ({flagged.length})
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (stage === "quiz") {
    const q = questions[idx];
    return (
      <div className="px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {idx + 1} of {questions.length}</span>
              <span>{Math.round((idx / questions.length) * 100)}%</span>
            </div>
            <Progress value={(idx / questions.length) * 100} />
          </div>

          <Card className="p-10 text-center">
            <div className="text-4xl font-semibold tabular-nums break-words">
              {q.prompt} <span className="text-muted-foreground">= ?</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-8 space-y-4">
              <Input
                autoFocus
                inputMode="decimal"
                type="number"
                step="any"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-center text-2xl h-14"
                placeholder="Your answer"
              />
              <Button type="submit" size="lg" className="w-full" disabled={input.trim() === ""}>
                {idx + 1 === questions.length ? "Finish" : "Next"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  const wrong = attempts.filter((a) => !a.correct);
  const score = attempts.length - wrong.length;
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-semibold">Test complete</h2>
          <p className="mt-2 text-5xl font-bold tabular-nums">{score} / {attempts.length}</p>
          <p className="mt-2 text-muted-foreground">
            {wrong.length === 0 ? "Perfect score!" : `${wrong.length} flagged for review.`}
          </p>
        </Card>

        {wrong.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Questions you got wrong</h3>
            <ul className="divide-y">
              {wrong.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="tabular-nums">{a.question.prompt}</span>
                  <span className="text-muted-foreground text-right">
                    <span className="line-through">{a.given}</span>{" "}
                    <span className="font-semibold text-foreground">= {a.question.answer}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setStage("setup")}>Back to setup</Button>
          <Button variant="outline" className="flex-1" onClick={start}>Retry</Button>
        </div>
      </div>
    </div>
  );
}
