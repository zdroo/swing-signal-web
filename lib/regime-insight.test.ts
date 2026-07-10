import { describe, expect, it } from "vitest";
import {
  computeMarketHealth,
  healthLabel,
  signalTone,
} from "@/lib/regime-insight";
import type { MacroIndicatorValueDto } from "@/types";

// The Market Health arithmetic is a user-facing promise ("supportive=100,
// neutral=55, caution=30, hostile=0, averaged within groups then across
// groups") — these tests pin it exactly, including both extremes.

const reading = (signal: string): MacroIndicatorValueDto => ({
  value: 1,
  signal,
  trend: "Stable",
});

/** Every indicator key the health groups know, all with the same signal. */
const ALL_KEYS = [
  "FedFundsRate", "FedBalanceSheet", "M2MoneySupply", "ReverseRepo", "RealYield10Y",
  "TreasuryYield10Y", "TreasuryYield2Y", "TreasuryYield3M", "YieldCurveSpread", "YieldSpread10Y3M",
  "CPI", "CorePCE",
  "GDP", "UnemploymentRate", "JoblessClaims", "SahmRule", "RetailSales", "HousingStarts", "ConsumerSentiment",
  "VIX", "HighYieldSpread", "DollarIndex", "CryptoFearGreed",
  "GoldPrice", "OilWTI", "Copper",
];

const allWith = (signal: string) =>
  Object.fromEntries(ALL_KEYS.map((k) => [k, reading(signal)]));

describe("signalTone", () => {
  it("maps the four directions exactly", () => {
    expect(signalTone("Healthy")).toBe("good");
    expect(signalTone("Panic")).toBe("bad");
    expect(signalTone("Elevated")).toBe("caution");
    expect(signalTone("Neutral")).toBe("neutral");
  });

  it("treats Extreme Fear as contrarian-good and Extreme Greed as bad", () => {
    expect(signalTone("Extreme Fear")).toBe("good");
    expect(signalTone("Extreme Greed")).toBe("bad");
  });

  it("falls back to neutral for unknown signals", () => {
    expect(signalTone("Some Future Signal")).toBe("neutral");
  });
});

describe("healthLabel band edges", () => {
  it.each([
    [100, "Supportive"],
    [70, "Supportive"],
    [69, "Steady"],
    [55, "Steady"],
    [54, "Mixed"],
    [40, "Mixed"],
    [39, "Strained"],
    [25, "Strained"],
    [24, "Stressed"],
    [0, "Stressed"],
  ])("score %i → %s", (score, label) => {
    expect(healthLabel(score)).toBe(label);
  });
});

describe("computeMarketHealth extremes", () => {
  it("every reading supportive → exactly 100, Supportive", () => {
    const health = computeMarketHealth(allWith("Healthy"));

    expect(health.score).toBe(100);
    expect(health.label).toBe("Supportive");
    expect(health.groups).toHaveLength(6);
    for (const group of health.groups) {
      expect(group.score).toBe(100);
      expect(group.label).toBe("Supportive");
    }
  });

  it("every reading hostile → exactly 0, Stressed", () => {
    const health = computeMarketHealth(allWith("Panic"));

    expect(health.score).toBe(0);
    expect(health.label).toBe("Stressed");
    for (const group of health.groups) {
      expect(group.score).toBe(0);
      expect(group.label).toBe("Stressed");
    }
  });

  it("every reading neutral → exactly 55, Steady", () => {
    const health = computeMarketHealth(allWith("Neutral"));

    expect(health.score).toBe(55);
    expect(health.label).toBe("Steady");
  });

  it("no indicators at all → score 0 and no groups", () => {
    const health = computeMarketHealth({});

    expect(health.score).toBe(0);
    expect(health.groups).toHaveLength(0);
  });
});

describe("computeMarketHealth group arithmetic", () => {
  it("averages tones within a group: good(100) + caution(30) → 65", () => {
    const health = computeMarketHealth({
      CPI: reading("Healthy"),      // good  → 100
      CorePCE: reading("Elevated"), // caution → 30
    });

    expect(health.groups).toHaveLength(1);
    expect(health.groups[0].name).toBe("Inflation");
    expect(health.groups[0].score).toBe(65);
    expect(health.groups[0].label).toBe("Steady");
    expect(health.score).toBe(65);
  });

  it("averages groups equally: 100-group and 0-group → overall 50, Mixed", () => {
    const health = computeMarketHealth({
      CPI: reading("Healthy"),       // Inflation: 100
      CorePCE: reading("Healthy"),
      GoldPrice: reading("Panic"),   // Commodities: 0
    });

    expect(health.groups.map((g) => g.score)).toEqual([100, 0]);
    expect(health.score).toBe(50);
    expect(health.label).toBe("Mixed");
  });

  it("group size does not change its vote: a 1-member group weighs like a 7-member group", () => {
    const health = computeMarketHealth({
      // Growth & Labor — all seven members hostile → 0
      GDP: reading("Contracting"),
      UnemploymentRate: reading("Contracting"),
      JoblessClaims: reading("Contracting"),
      SahmRule: reading("Recession Signal"),
      RetailSales: reading("Contracting"),
      HousingStarts: reading("Falling"),
      ConsumerSentiment: reading("Pessimistic"),
      // Commodities — one member, supportive → 100
      Copper: reading("Growth Signal"),
    });

    expect(health.groups.map((g) => g.score)).toEqual([0, 100]);
    expect(health.score).toBe(50);
  });

  it("only present indicators become members", () => {
    const health = computeMarketHealth({
      VIX: reading("Calm"),
      HighYieldSpread: reading("Stressed"),
    });

    expect(health.groups).toHaveLength(1);
    expect(health.groups[0].name).toBe("Market Stress");
    expect(health.groups[0].members.map((m) => m.key)).toEqual(["VIX", "HighYieldSpread"]);
    expect(health.groups[0].score).toBe(50); // (100 + 0) / 2
  });

  it("rounds half-up on uneven averages", () => {
    const health = computeMarketHealth({
      CPI: reading("Healthy"),       // 100
      CorePCE: reading("Neutral"),   // 55
    });

    expect(health.groups[0].score).toBe(78); // 77.5 → 78
  });
});
