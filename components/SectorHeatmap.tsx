import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { SectorRotationRowDto } from "@/types";

const STANCE_CHIP: Record<string, string> = {
  "Long bias": "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  "No edge": "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  "Stand aside": "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
};

// Tile tint encodes the regime edge — the heatmap signal. Green = the regime
// favors the sector, red = headwind, neutral = the regime is indifferent.
function tileTone(edge: number | null): string {
  if (edge === null) return "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40";
  if (edge >= 6) return "border-emerald-500/40 bg-emerald-500/15";
  if (edge >= 2) return "border-emerald-400/30 bg-emerald-400/[0.08]";
  if (edge > -2) return "border-zinc-300 dark:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-800/40";
  if (edge > -6) return "border-red-400/30 bg-red-400/[0.08]";
  return "border-red-500/40 bg-red-500/15";
}

function edgeColor(edge: number): string {
  return edge >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

export function SectorHeatmap({
  sectors,
  benchmark,
}: {
  sectors: SectorRotationRowDto[];
  benchmark: string;
}) {
  if (sectors.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center text-sm text-zinc-500">
        The sector board is still computing — check back in a few minutes.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((s) => (
        <Link
          key={s.symbol}
          href={`/odds/${encodeURIComponent(s.symbol)}`}
          className={`block rounded-xl border p-4 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 ${tileTone(s.edge3M)}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-zinc-900 dark:text-white">{s.sector}</span>
            <span className="text-xs text-zinc-500">{s.symbol}</span>
          </div>

          {/* Regime edge — the headline heatmap value */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${s.edge3M !== null ? edgeColor(s.edge3M) : "text-zinc-400"}`}>
              {s.edge3M !== null ? `${s.edge3M >= 0 ? "+" : ""}${s.edge3M.toFixed(1)}` : "—"}
            </span>
            <span className="text-xs text-zinc-500">pp regime edge</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {s.stance ? (
              <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${STANCE_CHIP[s.stance] ?? STANCE_CHIP["No edge"]}`}>
                {s.stance}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">pending data</span>
            )}

            {/* Momentum — relative strength vs the benchmark */}
            {s.relStrength3M !== null && (
              <span className={`inline-flex items-center gap-1 text-xs tabular-nums ${edgeColor(s.relStrength3M)}`}>
                {s.relStrength3M >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {s.relStrength3M >= 0 ? "+" : ""}{s.relStrength3M.toFixed(1)}% vs {benchmark}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
