// Turns raw indicator signals into UI insight: how much each indicator matters
// right now (severity), a plain-language tag per reading, and a short summary
// of the overall economic picture. Purely rule-based — no AI, fully auditable.

import type { MacroIndicatorValueDto } from "@/types";

// ── Severity: how market-moving is this signal right now? ────────────────
// 0 = background noise · 1 = mildly notable · 2 = market-moving · 3 = extreme
const SIGNAL_SEVERITY: Record<string, number> = {
  // extreme
  Panic: 3,
  Stressed: 3,
  "Recession Signal": 3,
  Inverted: 3,
  "Extreme Fear": 3,
  "Extreme Greed": 3,

  // market-moving
  Restrictive: 2,
  Accommodative: 2,
  "QE (Expanding)": 2,
  "QT (Contracting)": 2,
  "Negative (Easy)": 2,
  "Expanding Fast": 2,
  Elevated: 2,
  High: 2,
  Contracting: 2,
  Falling: 2,
  Warning: 2,
  Inflationary: 2,
  Deflationary: 2,
  Pessimistic: 2,
  "Risk-off": 2,
  "Strong USD": 2,
  "Growth Signal": 2,
  "Contraction Signal": 2,

  // mildly notable
  Flat: 1,
  Low: 1,
  Slow: 1,
  "Above Target": 1,
  Complacent: 1,
  Greed: 1,
  Fear: 1,
  Optimistic: 1,
  "Risk-on": 1,
  "Weak USD": 1,
  Expanding: 1,
  Strong: 1,
  Healthy: 1,

  // background
  Neutral: 0,
  Normal: 0,
  Stable: 0,
  Calm: 0,
  Moderate: 0,
  "On Target": 0,
  "No Signal": 0,
};

export function signalSeverity(signal: string): number {
  return SIGNAL_SEVERITY[signal] ?? 0;
}

/** Severity at or above this shows the "market mover" star. */
export const MARKET_MOVER_THRESHOLD = 2;

// ── Tone: is this reading supportive or hostile for the economy/markets? ──
// The single source of the good/caution/bad semantics — indicator cards and
// the market-health composite both consume this, so they can never disagree.
export type SignalTone = "good" | "neutral" | "caution" | "bad";

const SIGNAL_TONE: Record<string, SignalTone> = {
  // supportive
  Accommodative: "good",
  Healthy: "good",
  Low: "good",
  Expanding: "good",
  "Expanding Fast": "good",
  "QE (Expanding)": "good",
  "Negative (Easy)": "good",
  "On Target": "good",
  Strong: "good",
  Calm: "good",
  "No Signal": "good",
  "Growth Signal": "good",
  Optimistic: "good",
  "Risk-on": "good",
  "Weak USD": "good",
  "Extreme Fear": "good", // contrarian: historically a buy zone

  // hostile
  Restrictive: "bad",
  Inverted: "bad",
  Contracting: "bad",
  "QT (Contracting)": "bad",
  "Contraction Signal": "bad",
  Stressed: "bad",
  "Recession Signal": "bad",
  Panic: "bad",
  Pessimistic: "bad",
  Falling: "bad",
  "Risk-off": "bad",
  "Strong USD": "bad",
  "Extreme Greed": "bad",

  // caution
  Elevated: "caution",
  High: "caution",
  Flat: "caution",
  Warning: "caution",
  "Above Target": "caution",
  Slow: "caution",
  Inflationary: "caution",
  Complacent: "caution",
  Greed: "caution",
  Fear: "caution",

  // neutral
  Neutral: "neutral",
  Normal: "neutral",
  Stable: "neutral",
  Moderate: "neutral",
  Deflationary: "neutral",
};

export function signalTone(signal: string): SignalTone {
  return SIGNAL_TONE[signal] ?? "neutral";
}

// ── Plain-language tags: 2-3 words per reading ───────────────────────────
// Generic per signal, with per-indicator overrides where the same label
// means different things (e.g. "High" yields vs "High" reverse repo).
const GENERIC_TAGS: Record<string, string> = {
  Restrictive: "expensive money",
  Accommodative: "cheap money",
  Inverted: "recession warning",
  Flat: "cycle uncertainty",
  "QE (Expanding)": "printing money",
  "QT (Contracting)": "draining liquidity",
  "Negative (Easy)": "cash loses value",
  "Expanding Fast": "money surging",
  Panic: "fear spike",
  Complacent: "unusually calm",
  Stressed: "credit stress",
  "Recession Signal": "recession likely",
  Warning: "labor cooling",
  Pessimistic: "consumers gloomy",
  Optimistic: "consumers confident",
  Falling: "housing slowdown",
  "Risk-off": "flight to safety",
  "Risk-on": "risk appetite",
  Inflationary: "energy shock",
  Deflationary: "energy relief",
  "Growth Signal": "industry humming",
  "Contraction Signal": "industry slowing",
  "Strong USD": "global squeeze",
  "Weak USD": "liquidity tailwind",
  "Extreme Fear": "capitulation zone",
  Fear: "crypto fearful",
  Greed: "crypto greedy",
  "Extreme Greed": "euphoria warning",
  Slow: "weak growth",
  Expanding: "healthy growth",
  "Above Target": "sticky inflation",
  "On Target": "inflation on target",
  Healthy: "strong job market",
};

const TAG_OVERRIDES: Record<string, Record<string, string>> = {
  FedFundsRate:     { Neutral: "balanced policy" },
  TreasuryYield10Y: { High: "costly borrowing", Low: "easy borrowing" },
  TreasuryYield2Y:  { High: "cuts not priced", Low: "cuts expected" },
  TreasuryYield3M:  { High: "tight policy now", Low: "loose policy now" },
  ReverseRepo:      { High: "cash parked aside", Low: "buffer spent" },
  CPI:              { Elevated: "inflation pressure", Low: "inflation tamed" },
  CorePCE:          { Elevated: "inflation pressure" },
  UnemploymentRate: { Elevated: "labor weakness" },
  JoblessClaims:    { Elevated: "layoffs rising", Strong: "few layoffs" },
  GDP:              { Contracting: "economy shrinking" },
  M2MoneySupply:    { Contracting: "money shrinking" },
  RetailSales:      { Contracting: "consumers retreating", Strong: "consumers spending" },
  VIX:              { Elevated: "markets nervous" },
  HighYieldSpread:  { Elevated: "credit stress building" },
  GoldPrice:        { Neutral: "" },
  HousingStarts:    { Expanding: "construction boom" },
};

export function signalTag(indicatorKey: string, signal: string): string | null {
  const override = TAG_OVERRIDES[indicatorKey]?.[signal];
  if (override !== undefined) return override || null;
  return GENERIC_TAGS[signal] ?? null;
}

// ── Market health: a descriptive composite of today's signal states ──────
// Indicators combine into thematic groups, each group scores 0–100 from its
// members' tones, and the groups average (equal weight — the same family-
// weighting idea the matching engine uses) into one headline number. This
// SUMMARIZES the dashboard; it is not a prediction and plays no role in the
// odds engine.
type Indicators = Record<string, MacroIndicatorValueDto>;

const TONE_SCORE: Record<SignalTone, number> = {
  good: 100,
  neutral: 55, // "nothing notable" is mildly healthy, not mid-crisis
  caution: 30,
  bad: 0,
};

const HEALTH_GROUPS: { name: string; question: string; keys: string[] }[] = [
  {
    name: "Policy & Liquidity",
    question: "Is money cheap and flowing, or expensive and draining?",
    keys: ["FedFundsRate", "FedBalanceSheet", "M2MoneySupply", "ReverseRepo", "RealYield10Y"],
  },
  {
    name: "Rates & Yield Curve",
    question: "What does the bond market expect — growth or recession?",
    keys: ["TreasuryYield10Y", "TreasuryYield2Y", "TreasuryYield3M", "YieldCurveSpread", "YieldSpread10Y3M"],
  },
  {
    name: "Inflation",
    question: "Is inflation forcing the Fed's hand?",
    keys: ["CPI", "CorePCE"],
  },
  {
    name: "Growth & Labor",
    question: "Is the real economy expanding and employing?",
    keys: ["GDP", "UnemploymentRate", "JoblessClaims", "SahmRule", "RetailSales", "HousingStarts", "ConsumerSentiment"],
  },
  {
    name: "Market Stress",
    question: "Are markets calm or bracing for trouble?",
    keys: ["VIX", "HighYieldSpread", "DollarIndex", "CryptoFearGreed"],
  },
  {
    name: "Commodities",
    question: "What do raw materials say about demand and fear?",
    keys: ["GoldPrice", "OilWTI", "Copper"],
  },
];

export function healthLabel(score: number): string {
  if (score >= 70) return "Supportive";
  if (score >= 55) return "Steady";
  if (score >= 40) return "Mixed";
  if (score >= 25) return "Strained";
  return "Stressed";
}

export interface HealthMember {
  key: string;
  signal: string;
  tone: SignalTone;
}

export interface HealthGroup {
  name: string;
  question: string;
  score: number;
  label: string;
  members: HealthMember[];
}

export interface MarketHealth {
  score: number;
  label: string;
  groups: HealthGroup[];
}

export function computeMarketHealth(indicators: Indicators): MarketHealth {
  const groups: HealthGroup[] = [];

  for (const group of HEALTH_GROUPS) {
    const members: HealthMember[] = group.keys
      .filter((key) => key in indicators)
      .map((key) => ({
        key,
        signal: indicators[key].signal,
        tone: signalTone(indicators[key].signal),
      }));

    if (members.length === 0) continue;

    const score = Math.round(
      members.reduce((sum, m) => sum + TONE_SCORE[m.tone], 0) / members.length
    );
    groups.push({ name: group.name, question: group.question, score, label: healthLabel(score), members });
  }

  const score =
    groups.length === 0
      ? 0
      : Math.round(groups.reduce((sum, g) => sum + g.score, 0) / groups.length);

  return { score, label: healthLabel(score), groups };
}

function sig(indicators: Indicators, key: string): string | null {
  return indicators[key]?.signal ?? null;
}

function val(indicators: Indicators, key: string): number | null {
  return indicators[key]?.value ?? null;
}

export function summarizeRegime(indicators: Indicators): string[] {
  const sentences: string[] = [];

  // 1. Monetary policy & liquidity
  const fed = sig(indicators, "FedFundsRate");
  const bs = sig(indicators, "FedBalanceSheet");
  if (fed) {
    const policy =
      fed === "Restrictive"
        ? `The Fed is restrictive (rates at ${val(indicators, "FedFundsRate")?.toFixed(2)}%), deliberately cooling the economy`
        : fed === "Accommodative"
        ? `The Fed is accommodative (rates at ${val(indicators, "FedFundsRate")?.toFixed(2)}%), actively supporting the economy`
        : `The Fed is roughly neutral (rates at ${val(indicators, "FedFundsRate")?.toFixed(2)}%), neither stimulating nor restraining`;

    const liquidity =
      bs === "QE (Expanding)"
        ? ", while its balance sheet expands — liquidity is flowing into markets."
        : bs === "QT (Contracting)"
        ? ", while its balance sheet shrinks — liquidity is being drained."
        : bs
        ? ", with a stable balance sheet — no liquidity push in either direction."
        : ".";

    sentences.push(policy + liquidity);
  }

  // 2. Inflation
  const cpi = sig(indicators, "CPI");
  const pce = sig(indicators, "CorePCE");
  if (cpi || pce) {
    if (cpi === "Elevated" || pce === "Elevated") {
      sentences.push(
        `Inflation is running hot (CPI ${val(indicators, "CPI")?.toFixed(1)}% YoY) — the main constraint keeping policy tight.`
      );
    } else if (cpi === "Low" && pce !== "Above Target") {
      sentences.push(
        `Inflation is tame (CPI ${val(indicators, "CPI")?.toFixed(1)}% YoY), giving the Fed room to ease if the economy weakens.`
      );
    } else {
      sentences.push(
        `Inflation sits near target (CPI ${val(indicators, "CPI")?.toFixed(1)}% YoY) — not forcing the Fed's hand in either direction.`
      );
    }
  }

  // 3. Growth & labor
  const gdp = sig(indicators, "GDP");
  const unemp = sig(indicators, "UnemploymentRate");
  const sahm = sig(indicators, "SahmRule");
  const claims = sig(indicators, "JoblessClaims");
  if (sahm === "Recession Signal") {
    sentences.push(
      "The labor market has triggered the Sahm Rule — historically a reliable real-time recession confirmation."
    );
  } else if (sahm === "Warning" || claims === "Elevated" || unemp === "Elevated") {
    sentences.push(
      "The labor market is showing cracks — job losses are creeping up, which historically snowballs once it starts."
    );
  } else if (gdp === "Contracting") {
    sentences.push("Growth has turned negative even though the labor market holds — a fragile combination.");
  } else if (gdp === "Slow") {
    sentences.push("Growth is positive but sluggish, with the labor market still holding up.");
  } else if (gdp || unemp) {
    sentences.push("Growth and the labor market look solid — no recession signal from the real economy.");
  }

  // 4. Market stress & warnings
  const curve = sig(indicators, "YieldSpread10Y3M") ?? sig(indicators, "YieldCurveSpread");
  const vix = sig(indicators, "VIX");
  const hy = sig(indicators, "HighYieldSpread");
  const stressBits: string[] = [];
  if (curve === "Inverted") stressBits.push("the yield curve is inverted (a classic recession warning)");
  if (hy === "Stressed") stressBits.push("credit markets are stressed");
  else if (hy === "Elevated") stressBits.push("credit spreads are widening");
  if (vix === "Panic") stressBits.push("equity volatility is in panic territory");
  else if (vix === "Elevated") stressBits.push("equity markets are nervous");
  else if (vix === "Complacent") stressBits.push("volatility is unusually low — markets may be complacent");

  if (stressBits.length > 0) {
    sentences.push(
      `Warning signs: ${stressBits.join("; ")}.`
    );
  } else if (curve || vix || hy) {
    sentences.push("Market stress gauges are quiet — credit is calm and volatility is contained.");
  }

  // 5. Overall tone from severity distribution
  const all = Object.values(indicators);
  const movers = all.filter((i) => signalSeverity(i.signal) >= MARKET_MOVER_THRESHOLD).length;
  const extremes = all.filter((i) => signalSeverity(i.signal) >= 3).length;

  const tone =
    extremes >= 3
      ? "a high-tension macro backdrop — several indicators are at extremes, so expect regime-driven markets"
      : movers >= 6
      ? "a mixed, transitional backdrop — enough indicators are flashing to matter, without a clear crisis signal"
      : "a relatively calm macro backdrop — most indicators sit in normal ranges";

  sentences.push(
    `Overall: ${movers} of ${all.length} indicators are currently market-moving, suggesting ${tone}.`
  );

  return sentences;
}
