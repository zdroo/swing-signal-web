import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { InfoTip } from "@/components/InfoTip";
import type { SectorRotationRowDto } from "@/types";

const STANCE_CHIP: Record<string, string> = {
  "Long bias": "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  "No edge": "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  "Stand aside": "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
};

// Plain-language "what is this sector, and when does it tend to lead?"
const SECTOR_INFO: Record<string, string> = {
  XLK: "Software, chips and hardware — Apple, Microsoft, Nvidia. Growth-sensitive; tends to lead mid-cycle expansions.",
  XLF: "Banks, insurers and asset managers. Helped by rising rates and a healthy economy; a classic early-cycle leader.",
  XLE: "Oil & gas producers and services. Moves with commodity prices and inflation; typically a late-cycle leader.",
  XLV: "Drugmakers, insurers and medical devices. Defensive — demand holds up even in a downturn.",
  XLI: "Machinery, aerospace, transport and construction. Cyclical; tends to lead early in a recovery.",
  XLY: "Consumer non-essentials — retailers, autos, restaurants, travel. Rides consumer confidence; early-cycle.",
  XLP: "Consumer essentials — food, beverages, household goods. Defensive; holds up when the economy slows.",
  XLU: "Electric, gas and water providers. Defensive and bond-like; favored when rates fall or fear rises.",
  XLB: "Chemicals, metals, mining and packaging. Commodity- and inflation-sensitive; late-cycle.",
  XLRE: "REITs — property owners and landlords. Rate-sensitive; hurt by rising rates, helped by falling ones.",
  XLC: "Telecom, media and internet platforms — Meta, Google, Netflix. A mix of growth and defensives.",
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

function signColor(v: number): string {
  return v >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
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
    // Flex-wrap + justify-center so full rows fill edge-to-edge while an
    // incomplete last row (11 sectors → a row of 2) centers instead of
    // hugging the left. Tile widths mirror the old 1/2/3-column breakpoints.
    <div className="flex flex-wrap justify-center gap-3">
      {sectors.map((s) => (
        <div
          key={s.symbol}
          className={`w-full rounded-xl border p-4 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] ${tileTone(s.edge3M)}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="inline-flex items-center gap-1">
              <Link
                href={`/odds/${encodeURIComponent(s.symbol)}`}
                className="font-semibold text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {s.sector}
              </Link>
              {SECTOR_INFO[s.symbol] && <InfoTip align="left">{SECTOR_INFO[s.symbol]}</InfoTip>}
            </span>
            <span className="text-xs text-zinc-500">{s.symbol}</span>
          </div>

          {/* Regime edge — the headline heatmap value */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${s.edge3M !== null ? signColor(s.edge3M) : "text-zinc-400"}`}>
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

            {/* Momentum — relative strength vs the benchmark, with its own tooltip */}
            {s.relStrength3M !== null && (
              <InfoTip
                align="right"
                trigger={
                  <span className={`inline-flex cursor-help items-center gap-1 text-xs tabular-nums ${signColor(s.relStrength3M)}`}>
                    {s.relStrength3M >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {s.relStrength3M >= 0 ? "+" : ""}{s.relStrength3M.toFixed(1)}% vs {benchmark}
                  </span>
                }
              >
                {benchmark}{" "}tracks the S&amp;P 500 — the broad U.S. market. This is the sector&apos;s
                return <span className="font-medium">minus</span> {benchmark}&apos;s over the last ~3
                months, so{" "}
                <span className="font-medium">
                  {s.relStrength3M >= 0
                    ? `+${s.relStrength3M.toFixed(1)}% means it beat the market by ${s.relStrength3M.toFixed(1)} points`
                    : `${s.relStrength3M.toFixed(1)}% means it lagged the market by ${Math.abs(s.relStrength3M).toFixed(1)} points`}
                </span>{" "}
                (it can still be up in absolute terms). It&apos;s the momentum lens — where money is
                actually moving — separate from the regime edge.
              </InfoTip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
