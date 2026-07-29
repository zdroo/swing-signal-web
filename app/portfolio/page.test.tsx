// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PortfolioXrayDto } from "@/types";
import PortfolioPage from "./page";

const { getPortfolioXray, useAuthMock } = vi.hoisted(() => ({
  getPortfolioXray: vi.fn(),
  useAuthMock: vi.fn(),
}));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: { getPortfolioXray } };
});
vi.mock("@/context/AuthContext", () => ({ useAuth: useAuthMock }));
vi.mock("next/link", () => ({
  default: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const xray: PortfolioXrayDto = {
  regimeSummary: "A calm macro backdrop.",
  holdings: [
    { symbol: "SPY", name: "S&P 500", assetClass: "Stocks", posture: "Risk-on", weightPct: 100, medianReturn3M: 3.4, worstReturn3M: -26.6, volatilityPct: 13, liquidityBeta: -32 },
  ],
  concentration: { topWeightPct: 100, top3Pct: 100, hhi: 10000, label: "Concentrated", byClass: [{ assetClass: "Stocks", weightPct: 100 }] },
  exposure: { riskOnPct: 100, defensivePct: 0, liquidityBeta: -32, liquidityLabel: "Liquidity-insulated" },
  outcome: { analogs: 30, confidence: "Modest", positiveOddsPct: 65, medianReturn: 2.6, worstReturn: -12, bestReturn: 20.5 },
  reads: ["Concentrated book — 100% sits in SPY."],
  note: "A macro exposure lens, not advice.",
};

describe("/portfolio page", () => {
  it("gates behind an account when signed out", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<PortfolioPage />);
    expect(screen.getByText(/free account feature/)).toBeTruthy();
  });

  it("runs the X-ray and renders the outcome + reads", async () => {
    useAuthMock.mockReturnValue({ user: { email: "a@b.com", plan: "Free" }, loading: false });
    getPortfolioXray.mockResolvedValue(xray);
    const u = userEvent.setup();

    render(<PortfolioPage />);
    await u.type(screen.getAllByPlaceholderText("Ticker")[0], "SPY");
    await u.type(screen.getAllByPlaceholderText("Value")[0], "1000");
    await u.click(screen.getByRole("button", { name: /Run X-Ray/i }));

    await waitFor(() => expect(getPortfolioXray).toHaveBeenCalledWith([{ symbol: "SPY", value: 1000 }]));
    expect(await screen.findByText(/A book like yours, in regimes like today/)).toBeTruthy();
    expect(screen.getByText("+2.6%")).toBeTruthy();
    expect(screen.getByText(/Concentrated book/)).toBeTruthy();
  });
});
