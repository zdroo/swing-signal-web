// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { LiquidityDashboardDto } from "@/types";
import LiquidityPage from "./page";

const { getLiquidity } = vi.hoisted(() => ({ getLiquidity: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getLiquidity } }));
// The real chart pulls lightweight-charts (needs canvas) — stub it out
vi.mock("@/components/LiquidityChart", () => ({ LiquidityChart: () => <div data-testid="chart" /> }));
vi.mock("next/link", () => ({
  default: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a>,
}));

afterEach(() => cleanup());

const reading = (name: string, value: number, unit: string, tone: string) => ({
  name, value, unit, changePct3M: 2.1, trend: "Expanding", tone, plain: `${name} plain read`,
});

const dashboard: LiquidityDashboardDto = {
  asOf: "2026-07-22T00:00:00",
  globalLiquidity: reading("Global liquidity", 17.46, "$T", "bad"),
  fedNetLiquidity: reading("Fed net liquidity", 5.92, "$T", "good"),
  usM2: reading("US M2", 23.05, "$T", "good"),
  dollar: reading("US dollar (DXY)", 101.1, "index", "bad"),
  components: [
    { name: "Federal Reserve", valueUsdTrillions: 6.75, sharePct: 38.6 },
    { name: "ECB", valueUsdTrillions: 6.77, sharePct: 38.8 },
    { name: "Bank of Japan", valueUsdTrillions: 3.91, sharePct: 22.4 },
  ],
  series: [{ date: "2020-01-01", globalLiquidity: 15, fedNetLiquidity: 5, btc: 9000, spy: 300 }],
  overlays: [
    { symbol: "BTC", correlationPct: 33, months: 120 },
    { symbol: "SPY", correlationPct: 19, months: 120 },
  ],
  note: "Liquidity methodology note.",
};

describe("/liquidity page", () => {
  it("renders hero readings, correlation stats and CB components", async () => {
    getLiquidity.mockResolvedValue(dashboard);

    render(await LiquidityPage());

    expect(screen.getByText("Global liquidity")).toBeTruthy();
    expect(screen.getByText(/\$17\.46T/)).toBeTruthy();
    expect(screen.getByText("+33%")).toBeTruthy();
    expect(screen.getByText(/BTC · ~10-yr correlation/)).toBeTruthy();
    expect(screen.getByText("Federal Reserve")).toBeTruthy();
    expect(screen.getByTestId("chart")).toBeTruthy();
  });

  it("shows the warming state when no series has loaded yet", async () => {
    getLiquidity.mockResolvedValue({ ...dashboard, series: [], note: "Liquidity data is still loading." });

    render(await LiquidityPage());

    // Note renders in both the warming banner and the footer
    expect(screen.getAllByText(/still loading/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("degrades to an error card when the API is unreachable", async () => {
    getLiquidity.mockRejectedValue(new Error("network"));

    render(await LiquidityPage());

    expect(screen.getByText(/Could not reach the RegimeDeck API/)).toBeTruthy();
  });
});
