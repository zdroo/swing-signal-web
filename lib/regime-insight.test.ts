import { describe, expect, it } from "vitest";
import { signalTag } from "@/lib/regime-insight";

// The signal SEMANTICS (tone, severity, market health, narrative) moved to
// the backend and are pinned by RegimeInsightTests.cs. What remains here is
// the display copywriting.

describe("signalTag", () => {
  it("returns the generic tag for a known signal", () => {
    expect(signalTag("VIX", "Panic")).toBe("fear spike");
  });

  it("prefers the per-indicator override over the generic tag", () => {
    expect(signalTag("TreasuryYield10Y", "High")).toBe("costly borrowing");
    expect(signalTag("ReverseRepo", "High")).toBe("cash parked aside");
  });

  it("an empty override suppresses the tag entirely", () => {
    expect(signalTag("GoldPrice", "Neutral")).toBeNull();
  });

  it("returns null for unknown signals", () => {
    expect(signalTag("VIX", "Some Future Signal")).toBeNull();
  });
});
