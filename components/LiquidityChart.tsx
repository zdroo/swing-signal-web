"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useTheme } from "@/context/ThemeContext";
import { InfoTip } from "@/components/InfoTip";
import type { LiquidityPointDto } from "@/types";

// Global liquidity vs a risk asset, BOTH rebased to 100 at the window start.
// Indexing (not a dual axis) is the honest way to compare two series on wildly
// different scales — you see whether they move together, not their raw levels.

type Measure = "global" | "fednet";
type Asset = "BTC" | "SPY";

// Validated per-mode palette (dataviz validator: ALL PASS on both surfaces).
const LIQUIDITY_COLOR = { light: "#047857", dark: "#059669" };
const ASSET_COLOR = { light: "#7c3aed", dark: "#8b5cf6" };

const MEASURE_LABEL: Record<Measure, string> = {
  global: "Global liquidity",
  fednet: "Fed net liquidity",
};

function indexedTo100(points: LiquidityPointDto[], pick: (p: LiquidityPointDto) => number) {
  const base = pick(points[0]);
  if (!base) return [];
  return points.map((p) => ({ time: p.date.slice(0, 10) as Time, value: (pick(p) / base) * 100 }));
}

export function LiquidityChart({ series }: { series: LiquidityPointDto[] }) {
  const { theme } = useTheme();
  const [measure, setMeasure] = useState<Measure>("global");
  const [asset, setAsset] = useState<Asset>("BTC");
  const [readout, setReadout] = useState<{ liq: number; asset: number; date: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const liqRef = useRef<ISeriesApi<"Line"> | null>(null);
  const assetRef = useRef<ISeriesApi<"Line"> | null>(null);

  const liqColor = theme === "dark" ? LIQUIDITY_COLOR.dark : LIQUIDITY_COLOR.light;
  const assetColor = theme === "dark" ? ASSET_COLOR.dark : ASSET_COLOR.light;

  // Only the stretch where the chosen asset has prices; both lines rebase there.
  const windowed = useMemo(
    () => series.filter((p) => (asset === "BTC" ? p.btc : p.spy) != null),
    [series, asset],
  );

  // Create the chart + two line series once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      height: 340,
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#71717a" },
      grid: {
        vertLines: { color: "rgba(113, 113, 122, 0.12)" },
        horzLines: { color: "rgba(113, 113, 122, 0.12)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    chartRef.current = chart;
    liqRef.current = chart.addLineSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    assetRef.current = chart.addLineSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

    chart.subscribeCrosshairMove((param) => {
      const liq = param.seriesData.get(liqRef.current!) as { value: number } | undefined;
      const ast = param.seriesData.get(assetRef.current!) as { value: number } | undefined;
      if (!liq || !ast || !param.time) {
        setReadout(null);
        return;
      }
      setReadout({ liq: liq.value, asset: ast.value, date: String(param.time) });
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      liqRef.current = null;
      assetRef.current = null;
    };
  }, []);

  // Feed data on measure / asset change.
  useEffect(() => {
    if (!liqRef.current || !assetRef.current || windowed.length === 0) return;
    liqRef.current.setData(indexedTo100(windowed, (p) => (measure === "global" ? p.globalLiquidity : p.fedNetLiquidity)));
    assetRef.current.setData(indexedTo100(windowed, (p) => (asset === "BTC" ? p.btc! : p.spy!)));
    chartRef.current?.timeScale().fitContent();
    setReadout(null);
  }, [windowed, measure, asset]);

  // Recolor on theme change without rebuilding.
  useEffect(() => {
    liqRef.current?.applyOptions({ color: liqColor });
    assetRef.current?.applyOptions({ color: assetColor });
    chartRef.current?.applyOptions({
      layout: { textColor: theme === "dark" ? "#71717a" : "#52525b" },
    });
  }, [liqColor, assetColor, theme]);

  const startYear = windowed[0]?.date.slice(0, 4);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
          Liquidity vs risk assets
          <InfoTip>
            Both lines are rebased to 100 at the start of the window, so you compare how they have
            <em> moved</em> — not their raw levels, which sit on completely different scales (trillions
            of dollars vs a price). Rising together = liquidity and the asset moving in step.
          </InfoTip>
        </h2>

        <div className="flex flex-wrap gap-2">
          <Segmented
            options={[["global", "Global"], ["fednet", "Fed net"]]}
            value={measure}
            onChange={(v) => setMeasure(v as Measure)}
          />
          <Segmented
            options={[["BTC", "BTC"], ["SPY", "SPY"]]}
            value={asset}
            onChange={(v) => setAsset(v as Asset)}
          />
        </div>
      </div>

      {/* Legend + live crosshair readout (secondary encoding for the colors) */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <LegendItem color={liqColor} label={MEASURE_LABEL[measure]} value={readout?.liq} />
        <LegendItem color={assetColor} label={asset} value={readout?.asset} />
        <span className="ml-auto tabular-nums text-zinc-400">
          {readout ? readout.date : startYear ? `${startYear}–today · indexed to 100` : ""}
        </span>
      </div>

      {windowed.length === 0 ? (
        <div className="flex h-[340px] items-center justify-center text-sm text-zinc-500">
          Not enough history to chart yet.
        </div>
      ) : (
        <div ref={containerRef} className="h-[340px] w-full" />
      )}
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
      {value != null && <span className="tabular-nums font-medium text-zinc-900 dark:text-white">{value.toFixed(0)}</span>}
    </span>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === v
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
