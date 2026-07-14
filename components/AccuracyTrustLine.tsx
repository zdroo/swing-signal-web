import { ShieldCheck } from "lucide-react";

// A credibility line at the point of decision: RegimeDeck's whole edge is
// honest, verifiable calibration, so say so — and point to the backtest that
// proves it. Uses only data already on the page (no extra fetch).
export function AccuracyTrustLine({ matchesUsed }: { matchesUsed: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-zinc-900 dark:text-white">How accurate is this?</span>{" "}
        No opinions, no black box — these odds are calibrated on the {matchesUsed} closest macro
        periods since 1990 and backtested walk-forward.
      </span>
      <a
        href="#backtest"
        className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
      >
        Check the model&apos;s accuracy ↓
      </a>
    </div>
  );
}
