import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maths 4 in One" },
      { name: "description", content: "Practice add, subtract, multiply and divide with custom mock tests." },
    ],
  }),
  component: Index,
});

type Op = "+" | "-" | "×" | "÷";
type Difficulty = "easy" | "medium" | "hard";
type Mode = "normal" | "flagged";

interface Question {
  id: string;
  op: Op;
  a: number;
  b: number;
  answer: number;
}

interface Attempt {
  question: Question;
  given: string;
  correct: boolean;
}

const FLAG_KEY = "maths4_flagged_v1";

function loadFlags(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFlags(qs: Question[]) {
  localStorage.setItem(FLAG_KEY, JSON.stringify(qs));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rangeFor(diff: Difficulty, op: Op): [number, number] {
  if (op === "×" || op === "÷") {
    if (diff === "easy") return [2, 10];
    if (diff === "medium") return [2, 15];
    return [5, 25];
  }
  if (diff === "easy") return [1, 20];
  if (diff === "medium") return [10, 100];
  return [50, 999];
}

function makeQuestion(ops: Op[], diff: Difficulty): Question {
  const op = ops[Math.floor(Math.random() * ops.length)];
  const [min, max] = rangeFor(diff, op);
  let a = rand(min, max);
  let b = rand(min, max);
  let answer = 0;
  if (op === "+") answer = a + b;
  else if (op === "-") {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
  } else if (op === "×") answer = a * b;
  else {
    // ensure clean division
    answer = rand(min, max);
    b = rand(Math.max(2, min), max);
    a = answer * b;
  }
  return {
    id: `${op}-${a}-${b}-${Math.random().toString(36).slice(2, 7)}`,
    op,
    a,
    b,
    answer,
  };
}

function Index() {
  const [stage, setStage] = useState<"setup" | "quiz" | "results">("setup");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("normal");
  const [ops, setOps] = useState<Record<Op, boolean>>({ "+": true, "-": true, "×": true, "÷": true });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [flagged, setFlagged] = useState<Question[]>([]);

  useEffect(() => {
    setFlagged(loadFlags());
  }, []);

  const enabledOps = useMemo(() => (Object.keys(ops) as Op[]).filter((o) => ops[o]), [ops]);

  function start() {
    let qs: Question[] = [];
    if (mode === "flagged") {
      if (flagged.length === 0) return;
      const pool = [...flagged];
      for (let i = 0; i < count; i++) qs.push(pool[i % pool.length]);
    } else {
      if (enabledOps.length === 0) return;
      for (let i = 0; i < count; i++) qs.push(makeQuestion(enabledOps, difficulty));
    }
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
    const correct = Number(given) === q.answer;
    const nextAttempts = [...attempts, { question: q, given, correct }];
    setAttempts(nextAttempts);
    setInput("");
    if (idx + 1 >= questions.length) {
      // finish
      const wrong = nextAttempts.filter((a) => !a.correct).map((a) => a.question);
      const dedup = new Map<string, Question>();
      [...flagged, ...wrong].forEach((q) => dedup.set(`${q.op}|${q.a}|${q.b}`, q));
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
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Maths 4 in One</h1>
            <p className="mt-2 text-muted-foreground">Add, subtract, multiply, divide — your way.</p>
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

                <div className="space-y-2">
                  <Label>Operations</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["+", "-", "×", "÷"] as Op[]).map((o) => (
                      <Button
                        key={o}
                        type="button"
                        variant={ops[o] ? "default" : "outline"}
                        onClick={() => setOps({ ...ops, [o]: !ops[o] })}
                      >
                        {o}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={start}
              disabled={(mode === "normal" && enabledOps.length === 0) || (mode === "flagged" && flagged.length === 0)}
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
      </main>
    );
  }

  if (stage === "quiz") {
    const q = questions[idx];
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {idx + 1} of {questions.length}</span>
              <span>{Math.round(((idx) / questions.length) * 100)}%</span>
            </div>
            <Progress value={(idx / questions.length) * 100} />
          </div>

          <Card className="p-10 text-center">
            <div className="text-5xl font-semibold tabular-nums">
              {q.a} {q.op} {q.b} = ?
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="mt-8 space-y-4"
            >
              <Input
                autoFocus
                inputMode="numeric"
                type="number"
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
      </main>
    );
  }

  // results
  const wrong = attempts.filter((a) => !a.correct);
  const score = attempts.length - wrong.length;
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-semibold">Test complete</h2>
          <p className="mt-2 text-5xl font-bold tabular-nums">
            {score} / {attempts.length}
          </p>
          <p className="mt-2 text-muted-foreground">
            {wrong.length === 0 ? "Perfect score!" : `${wrong.length} flagged for review.`}
          </p>
        </Card>

        {wrong.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Questions you got wrong</h3>
            <ul className="divide-y">
              {wrong.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span className="tabular-nums">
                    {a.question.a} {a.question.op} {a.question.b}
                  </span>
                  <span className="text-muted-foreground">
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
    </main>
  );
}
