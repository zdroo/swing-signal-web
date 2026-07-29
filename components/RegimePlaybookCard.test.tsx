// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RegimePlaybookCard } from "./RegimePlaybookCard";
import type { RegimePlaybookDto } from "@/types";

afterEach(() => cleanup());

const regime: RegimePlaybookDto = {
  id: "stagflation",
  name: "Stagflation",
  summary: "Inflation stays hot while growth stalls.",
  hallmarks: ["Inflation hot", "Growth stalling"],
  healthScore: 22,
  healthLabel: "Stressed",
  isCurrent: false,
  matchScore: 41,
  playbook: {
    headline: "Conditions favor Gold.",
    note: "Descriptive, not advice.",
    assets: [
      { name: "Gold", score: 72, verdict: "Favored", reasons: ["hot inflation strengthens the hedge case"] },
      { name: "Stocks", score: 30, verdict: "Headwinds", reasons: ["earnings risk"] },
    ],
  },
};

describe("RegimePlaybookCard", () => {
  it("renders the regime, health label, hallmarks and ranked assets", () => {
    render(<RegimePlaybookCard regime={regime} />);

    expect(screen.getByText("Stagflation")).toBeTruthy();
    expect(screen.getByText(/Stressed 22/)).toBeTruthy();
    expect(screen.getByText("Inflation hot")).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    expect(screen.getByText("Favored")).toBeTruthy();
  });

  it("keeps the per-asset reasons out of the initial DOM (behind an info tip)", () => {
    render(<RegimePlaybookCard regime={regime} />);

    // Reasons only appear once the info tip is opened (hover/tap)
    expect(screen.queryByText(/strengthens the hedge case/)).toBeNull();
    // …but an info trigger is present for each asset
    expect(screen.getAllByLabelText("More information").length).toBeGreaterThanOrEqual(
      regime.playbook.assets.length,
    );
  });

  it("labels a non-current regime by how much it looks like today", () => {
    render(<RegimePlaybookCard regime={regime} />);

    expect(screen.getByText(/41% like today/)).toBeTruthy();
    expect(screen.queryByText(/We're here now/)).toBeNull();
  });

  it("flags the current regime with a 'we're here now' badge", () => {
    render(<RegimePlaybookCard regime={{ ...regime, isCurrent: true }} />);

    expect(screen.getByText(/We're here now · 41% fit/)).toBeTruthy();
  });
});
