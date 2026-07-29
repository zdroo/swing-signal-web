import type { PlaybookVerdict, RegimePlaybookDto } from "@/types";
import { FitMeter, VERDICT_CHIP } from "@/components/Playbook";
import { InfoTip } from "@/components/InfoTip";
import { CheckCircle2 } from "lucide-react";

// One regime on the playbook board: what this kind of market has historically
// favored. The per-asset "why" lives behind an info tip so the card stays
// scannable. `featured` is the current regime (emerald ring, lead-in copy).

function healthChip(label: string): string {
  switch (label) {
    case "Supportive":
    case "Steady":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400";
    case "Mixed":
      return "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400";
    default: // Strained | Stressed
      return "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400";
  }
}

// Plain-words meaning of the verdict — so "Favored / Headwinds" isn't jargon.
const VERDICT_LEAD: Record<PlaybookVerdict, string> = {
  Favored: "Conditions like these have historically been a tailwind.",
  Neutral: "Conditions like these have historically been a coin toss — no strong lean.",
  Headwinds: "Conditions like these have historically been a headwind.",
};

export function RegimePlaybookCard({
  regime,
  featured = false,
}: {
  regime: RegimePlaybookDto;
  featured?: boolean;
}) {
  const { name, summary, hallmarks, healthLabel, healthScore, playbook, isCurrent, matchScore } = regime;

  return (
    <section
      className={`rounded-2xl border p-5 ${
        isCurrent
          ? "border-emerald-400/60 bg-emerald-400/5 ring-1 ring-emerald-400/40"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">{name}</h2>
          <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${healthChip(healthLabel)}`}>
            {healthLabel} {healthScore}
          </span>
          <InfoTip align="center">
            The regime&apos;s overall backdrop health, 0–100 ({healthScore} here) — a blend of growth,
            inflation, policy, rates and market stress. Higher is calmer and more supportive.
          </InfoTip>
        </div>
        {isCurrent ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            We&apos;re here now · {matchScore}% fit
          </span>
        ) : (
          matchScore > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              {matchScore}% like today
              <InfoTip align="right">
                How closely today&apos;s macro readings line up with this regime. 100% would be an exact
                match; the highest one is where we are now.
              </InfoTip>
            </span>
          )
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{summary}</p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {hallmarks.map((h) => (
          <li
            key={h}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-400"
          >
            {h}
          </li>
        ))}
      </ul>

      <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
        {featured ? "What this environment has historically favored" : "Historically favored"}
        <span className="text-zinc-400">— best to worst</span>
        <InfoTip align="left">
          Over the life of the regime — typically weeks to months, not days. This is a lean to hold
          while the economy stays in this regime, and to rotate out of when it shifts to a different
          one. It&apos;s the backdrop, not a precise buy/sell trigger — for timed entry odds and price
          targets on a specific asset, open its odds page.
        </InfoTip>
      </p>

      <div className="mt-2 space-y-2.5">
        {playbook.assets.map((asset) => (
          <div key={asset.name}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{asset.name}</span>
                <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${VERDICT_CHIP[asset.verdict]}`}>
                  {asset.verdict}
                </span>
                <InfoTip align="left">
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">
                    {asset.name}: {VERDICT_LEAD[asset.verdict]}
                  </p>
                  {asset.reasons.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {asset.reasons.map((reason) => (
                        <li key={reason} className="flex gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </InfoTip>
              </div>
              <span className="text-xs tabular-nums text-zinc-500">{asset.score}</span>
            </div>
            <div className="mt-1.5">
              <FitMeter score={asset.score} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
