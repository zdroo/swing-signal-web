import { getIndicator } from "@/lib/indicators";
import type { MarketHealthDto, SignalTone } from "@/types";
import { ArrowDown } from "lucide-react";

// Visual composition of the regime: indicator chips → thematic group meters
// → one combined Market Health number. Status colors always travel with a
// text label, never alone.

const TONE_CHIP: Record<SignalTone, string> = {
  good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  neutral: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  caution: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
  bad: "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400",
};

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

function Meter({ score }: { score: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${meterColor(score)}`}
        style={{ width: `${Math.max(3, score)}%` }}
      />
    </div>
  );
}

export function MarketHealth({ health }: { health: MarketHealthDto }) {
  if (health.groups.length === 0) return null;

  return (
    <div>
      {/* Step 1: the thematic groups, each combining its indicators */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {health.groups.map((group) => (
          <div
            key={group.name}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{group.name}</h3>
              <span className={`text-xs font-semibold ${labelColor(group.score)}`}>
                {group.label} · {group.score}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{group.question}</p>
            <div className="mt-2.5">
              <Meter score={group.score} />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {group.members.map((m) => (
                <span
                  key={m.key}
                  className={`rounded-md border px-1.5 py-0.5 text-[11px] ${TONE_CHIP[m.tone]}`}
                >
                  {getIndicator(m.key)?.name ?? m.key}
                  <span className="opacity-70"> · {m.signal}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Step 2: the groups combine, each counting equally */}
      <div className="my-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <ArrowDown className="h-3.5 w-3.5" />
        the {health.groups.length} groups combine, each counting equally
        <ArrowDown className="h-3.5 w-3.5" />
      </div>

      {/* Step 3: the headline number */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Market Health
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums text-zinc-900 dark:text-white">
                {health.score}
              </span>
              <span className="text-lg text-zinc-500">/ 100</span>
              <span className={`ml-1 text-lg font-semibold ${labelColor(health.score)}`}>
                {health.label}
              </span>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <Meter score={health.score} />
            <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
              <span>0 · stressed</span>
              <span>50 · mixed</span>
              <span>100 · supportive</span>
            </div>
          </div>
        </div>
        <p className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-2.5 text-xs leading-relaxed text-zinc-500">
          A descriptive score of today&apos;s signal states: supportive readings count 100,
          neutral 55, caution 30, hostile 0, averaged within each group and then across
          groups. It summarizes this dashboard — it is <span className="font-medium">not a
          prediction</span> and plays no role in the odds engine.
        </p>
      </div>
    </div>
  );
}
