import Link from "next/link";
import type { MarketHealthDto, PlaybookDto } from "@/types";
import { ArrowRight, ScrollText } from "lucide-react";

// The five-second version of Current Market Conditions for the dashboard:
// health score, the playbook's one-line takeaway, and a door to the full
// breakdown on /macro. The derivation (groups, reasons, narrative) lives
// there — this never repeats it.

function meterColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 55) return "bg-emerald-600/70";
  if (score >= 40) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

function labelColor(score: number): string {
  if (score >= 55) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function ConditionsStrip({
  health,
  playbook,
  summary,
}: {
  health: MarketHealthDto;
  playbook?: PlaybookDto;
  summary: string[];
}) {
  // A cached pre-upgrade API response can briefly lack these fields right
  // after a deploy — degrade to nothing rather than crash the page
  if (!health?.groups?.length) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <ScrollText className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Market Health
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                {health.score}
              </span>
              <span className="text-sm text-zinc-500">/ 100</span>
              <span className={`ml-1 text-sm font-semibold ${labelColor(health.score)}`}>
                {health.label}
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${meterColor(health.score)}`}
            style={{ width: `${Math.max(3, health.score)}%` }}
          />
        </div>

        <div className="min-w-0 flex-1">
          {playbook?.headline && (
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{playbook.headline}</p>
          )}
          {summary?.[0] && (
            <p className="mt-0.5 truncate text-xs text-zinc-500" title={summary[0]}>
              {summary[0]}
            </p>
          )}
        </div>

        <Link
          href="/macro"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
        >
          Full breakdown
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
