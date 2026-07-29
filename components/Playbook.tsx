import type { PlaybookDto, PlaybookVerdict } from "@/types";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";

// The regime playbook: which asset class current conditions favor for NEW
// money, ranked, with the rule-based reasons spelled out. Computed on the
// backend (RegimeInsight.ComputePlaybook) — this only renders it.

// Shared with the regime-playbook cards so both render fit identically.
export const VERDICT_CHIP: Record<PlaybookVerdict, string> = {
  Favored: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  Neutral: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  Headwinds: "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400",
};

function fitColor(score: number): string {
  if (score >= 65) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

export function FitMeter({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${fitColor(score)}`}
        style={{ width: `${Math.max(3, score)}%` }}
      />
    </div>
  );
}

export function Playbook({ playbook }: { playbook: PlaybookDto }) {
  if (!playbook?.assets?.length) return null;

  const [top, ...rest] = playbook.assets;

  return (
    <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Where Conditions Point for New Money
        </h3>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">{playbook.headline}</p>

      {/* Best fit, with the full why */}
      <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-zinc-900 dark:text-white">{top.name}</span>
            <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${VERDICT_CHIP[top.verdict]}`}>
              {top.verdict}
            </span>
          </div>
          <span className="text-xs tabular-nums text-zinc-500">fit {top.score} / 100</span>
        </div>
        <div className="mt-2">
          <FitMeter score={top.score} />
        </div>
        {top.reasons.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {top.reasons.map((reason) => (
              <li key={reason} className="flex gap-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="text-emerald-600 dark:text-emerald-400">•</span>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The rest of the field, ranked */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rest.map((asset) => (
          <div
            key={asset.name}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{asset.name}</span>
                <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${VERDICT_CHIP[asset.verdict]}`}>
                  {asset.verdict}
                </span>
              </div>
              <span className="text-xs tabular-nums text-zinc-500">{asset.score}</span>
            </div>
            <div className="mt-2">
              <FitMeter score={asset.score} />
            </div>
            {asset.reasons.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {asset.reasons.map((reason) => (
                  <li key={reason} className="text-[11px] leading-relaxed text-zinc-500">
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">{playbook.note}</p>

      <Link
        href="/playbook"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        Compare this across every macro regime
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
