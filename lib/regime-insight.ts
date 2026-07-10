// Plain-language display tags for indicator readings. All signal SEMANTICS
// (severity, tone, market health, the narrative) are computed by the backend
// (RegimeInsight.cs) and arrive on the DTO - this file is copywriting only.
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
