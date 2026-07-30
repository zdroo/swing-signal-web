// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PositionSizer } from "./PositionSizer";
import type { AssetOddsDto, OddsForPeriodDto } from "@/types";

afterEach(() => cleanup());

const period = (worst: number): OddsForPeriodDto => ({
  totalCases: 30, positiveCases: 18, positiveOdds: 60, averageReturn: 2, medianReturn: 1,
  bestCase: 15, worstCase: worst, baseRate: 58, edge: 2,
});

const odds: AssetOddsDto = {
  symbol: "SPY", name: "S&P 500", matchesUsed: 40, currentPrice: 100,
  oneMonth: period(-8), threeMonths: period(-20), sixMonths: period(-30),
  explanations: [], disclaimer: "", breakdown: null, tradeRead: null,
};

describe("PositionSizer", () => {
  it("prompts for account size before sizing", () => {
    render(<PositionSizer odds={odds} />);
    expect(screen.getByText(/Enter your account size/)).toBeTruthy();
  });

  it("sizes against the regime worst case", async () => {
    const u = userEvent.setup();
    render(<PositionSizer odds={odds} />);

    // $10,000 account, default 2% risk = $200 budget; 3M worst -20% → max $1,000
    await u.type(screen.getByPlaceholderText("10,000"), "10000");

    // Appears in both the headline and the 3-month table row
    expect(screen.getAllByText("$1,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/whole risk budget/)).toBeTruthy();
    expect(screen.getByText("$2,500")).toBeTruthy(); // 1-month: budget 200 / 8% worst

  });
});
