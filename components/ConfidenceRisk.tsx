import type { OddsForPeriodDto } from "@/types";
import { InfoTip } from "@/components/InfoTip";
import { Gauge, TrendingDown } from "lucide-react";

// Two honesty-first readings shown before any odds: how much to trust them
// (sample size) and what the downside actually looked like (outcome range).
// No point estimates, no price targets — leans and risk, not predictions.

function confidenceOf(matchesUsed: number): { label: string; chip: string } {
  if (matchesUsed < 15)
    return { label: "Very low confidence", chip: "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400" };
  if (matchesUsed < 30)
    return { label: "Low confidence", chip: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400" };
  // Even the full ~40 declustered analogs is a modest sample — never "high".
  return { label: "Modest confidence", chip: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" };
}

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function ConfidenceRisk({
  matchesUsed,
  threeMonth,
  symbol,
}: {
  matchesUsed: number;
  threeMonth: OddsForPeriodDto;
  symbol: string;
}) {
  const conf = confidenceOf(matchesUsed);
  const hasRange = threeMonth.totalCases > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-500">How much to trust this</span>
          <InfoTip align="left">
            These readings come from {matchesUsed} overlapping historical analog periods — a small
            sample by any statistical standard. Read them as leans, not predictions; the odds are
            already pulled toward the base rate for exactly this reason, and we never claim high
            confidence.
          </InfoTip>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-sm font-semibold ${conf.chip}`}>
            {conf.label}
          </span>
          <span className="text-sm text-zinc-500">{matchesUsed} analog periods</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          A small, overlapping sample — treat every number below as a lean, not a forecast.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-500">Downside seen in these regimes</span>
          <InfoTip align="right">
            The spread of 3-month outcomes across the analog periods — the realistic range, not a
            target. The worst case actually happened once in comparable macro conditions; size your
            risk against it, not the median.
          </InfoTip>
        </div>
        {hasRange ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                {pct(threeMonth.worstCase)}
              </span>
              <span className="text-sm text-zinc-500">worst 3-month outcome</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              3-month range for {symbol}: {pct(threeMonth.worstCase)} to {pct(threeMonth.bestCase)},
              middle outcome {pct(threeMonth.medianReturn)}.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Not enough history for a 3-month range.</p>
        )}
      </div>
    </div>
  );
}
