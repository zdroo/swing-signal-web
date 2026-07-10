import type { TradeReadDto, TradeStance } from "@/types";
import { Scale } from "lucide-react";

// The statistical read: what the analog odds support right now — stance,
// horizon, and how much weight the evidence carries. Computed on the
// backend (TradeRead.Compute) with fixed rules; this only renders it.

const STANCE_STYLE: Record<TradeStance, { chip: string; border: string }> = {
  "Long bias": {
    chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-400/40",
  },
  "No edge": {
    chip: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-800",
  },
  "Stand aside": {
    chip: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
    border: "border-amber-400/40",
  },
};

function horizonLabel(days: number): string {
  return days >= 180 ? "6-month" : days >= 90 ? "3-month" : "1-month";
}

export function TradeReadCard({ read }: { read: TradeReadDto }) {
  if (!read?.stance) return null;

  const style = STANCE_STYLE[read.stance] ?? STANCE_STYLE["No edge"];

  return (
    <section className={`rounded-2xl border ${style.border} bg-white dark:bg-zinc-900 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Statistical Read</h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${style.chip}`}>
            {read.stance}
          </span>
          <span className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {horizonLabel(read.horizonDays)} horizon
          </span>
          <span className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {read.strength} evidence
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {read.reasons.map((reason) => (
          <li key={reason} className="flex gap-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400">•</span>
            {reason}
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-2.5 text-xs leading-relaxed text-zinc-500">
        {read.note}
      </p>
    </section>
  );
}
