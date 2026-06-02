export type Difficulty = "easy" | "medium" | "hard";
export type Op = "+" | "-" | "×" | "÷";
export type Topic =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "squares"
  | "sqrt"
  | "powers"
  | "pythagoras"
  | "percentages";

export interface Question {
  id: string;
  prompt: string;
  answer: number;
  topic: Topic;
}

export interface Settings {
  topics: Record<Topic, boolean>;
  decimals: number; // allowed decimal places in answer matching
}

export const DEFAULT_SETTINGS: Settings = {
  topics: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    squares: false,
    sqrt: false,
    powers: false,
    pythagoras: false,
    percentages: false,
  },
  decimals: 2,
};

export const ALL_TOPICS: Topic[] = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "squares",
  "sqrt",
  "powers",
  "pythagoras",
  "percentages",
];

export const TOPIC_LABELS: Record<Topic, string> = {
  add: "Addition (+)",
  subtract: "Subtraction (−)",
  multiply: "Multiplication (×)",
  divide: "Division (÷)",
  squares: "Squares (n²)",
  sqrt: "Square roots (√n)",
  powers: "Powers (nᵏ)",
  pythagoras: "Pythagoras (a² + b² = c²)",
  percentages: "Percentages (x% of n)",
};

const SETTINGS_KEY = "maths4_settings_v1";
const FLAG_KEY = "maths4_flagged_v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      topics: { ...DEFAULT_SETTINGS.topics, ...(parsed.topics ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadFlags(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveFlags(qs: Question[]) {
  localStorage.setItem(FLAG_KEY, JSON.stringify(qs));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(n: number, dp: number) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function arithRange(diff: Difficulty, op: Op): [number, number] {
  if (op === "×" || op === "÷") {
    if (diff === "easy") return [2, 10];
    if (diff === "medium") return [2, 15];
    return [5, 25];
  }
  if (diff === "easy") return [1, 20];
  if (diff === "medium") return [10, 100];
  return [50, 999];
}

function makeArith(op: Op, diff: Difficulty): Question {
  const [min, max] = arithRange(diff, op);
  let a = rand(min, max);
  let b = rand(min, max);
  let answer = 0;
  if (op === "+") answer = a + b;
  else if (op === "-") {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
  } else if (op === "×") answer = a * b;
  else {
    answer = rand(min, max);
    b = rand(Math.max(2, min), max);
    a = answer * b;
  }
  return { id: id(op), prompt: `${a} ${op} ${b}`, answer, topic: opToTopic(op) };
}

function opToTopic(op: Op): Topic {
  return op === "+" ? "add" : op === "-" ? "subtract" : op === "×" ? "multiply" : "divide";
}

function makeSquare(diff: Difficulty): Question {
  const max = diff === "easy" ? 12 : diff === "medium" ? 20 : 30;
  const n = rand(2, max);
  return { id: id("sq"), prompt: `${n}²`, answer: n * n, topic: "squares" };
}

function makeSqrt(diff: Difficulty): Question {
  const max = diff === "easy" ? 12 : diff === "medium" ? 20 : 30;
  const n = rand(2, max);
  return { id: id("sr"), prompt: `√${n * n}`, answer: n, topic: "sqrt" };
}

function makePower(diff: Difficulty): Question {
  const base = diff === "easy" ? rand(2, 6) : diff === "medium" ? rand(2, 10) : rand(2, 12);
  const exp = diff === "easy" ? rand(2, 3) : diff === "medium" ? rand(2, 4) : rand(3, 5);
  return { id: id("pw"), prompt: `${base}^${exp}`, answer: Math.pow(base, exp), topic: "powers" };
}

function makePythag(diff: Difficulty): Question {
  // Pick a triple-style problem: give a and b, find c (rounded to 2dp).
  const max = diff === "easy" ? 10 : diff === "medium" ? 20 : 40;
  const a = rand(3, max);
  const b = rand(3, max);
  const c = round(Math.sqrt(a * a + b * b), 2);
  return {
    id: id("py"),
    prompt: `Hypotenuse: a=${a}, b=${b} → c (2dp)`,
    answer: c,
    topic: "pythagoras",
  };
}

function makePercent(diff: Difficulty): Question {
  const pcts = diff === "easy" ? [10, 25, 50] : diff === "medium" ? [5, 10, 15, 20, 25, 50, 75] : [3, 7, 12, 17, 23, 38, 64];
  const pct = pcts[rand(0, pcts.length - 1)];
  const baseMax = diff === "easy" ? 100 : diff === "medium" ? 500 : 2000;
  const base = rand(2, baseMax / 10) * 10;
  const ans = round((pct * base) / 100, 2);
  return { id: id("pc"), prompt: `${pct}% of ${base}`, answer: ans, topic: "percentages" };
}

export function makeQuestion(topics: Topic[], diff: Difficulty): Question {
  const t = topics[Math.floor(Math.random() * topics.length)];
  switch (t) {
    case "add": return makeArith("+", diff);
    case "subtract": return makeArith("-", diff);
    case "multiply": return makeArith("×", diff);
    case "divide": return makeArith("÷", diff);
    case "squares": return makeSquare(diff);
    case "sqrt": return makeSqrt(diff);
    case "powers": return makePower(diff);
    case "pythagoras": return makePythag(diff);
    case "percentages": return makePercent(diff);
  }
}

export function checkAnswer(given: string, q: Question): boolean {
  const n = Number(given);
  if (Number.isNaN(n)) return false;
  return Math.abs(n - q.answer) < 0.01;
}
