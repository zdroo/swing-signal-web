import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { LiquidityChart } from "@/components/LiquidityChart";
import type { LiquidityDashboardDto, LiquidityReadingDto } from "@/types";
import { AlertCircle, ArrowLeft, Droplets, Waves } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Liquidity",
  description:
    "Global central-bank liquidity (Fed + ECB + Bank of Japan) and US net liquidity, tracked against Bitcoin and the S&P 500. Macro liquidity is the tide under risk assets — here's where it stands.",
  alternates: { canonical: "/liquidity" },
};

const TONE_TEXT: Record<string, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  bad: "text-red-700 dark:text-red-400",
  neutral: "text-zinc-500",
};

const TONE_CHIP: Record<string, string> = {
  good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  bad: "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400",
  neutral: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
};

function fmt(r: LiquidityReadingDto): string {
  return r.unit === "$T" ? `$${r.value.toFixed(2)}T` : r.value.toFixed(1);
}

function HeroReading({ reading }: { reading: LiquidityReadingDto }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-500">{reading.name}</span>
        <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${TONE_CHIP[reading.tone]}`}>
          {reading.trend}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{fmt(reading)}</span>
        <span className={`text-sm font-medium tabular-nums ${TONE_TEXT[reading.tone]}`}>
          {reading.changePct3M >= 0 ? "+" : ""}
          {reading.changePct3M.toFixed(1)}% 3M
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{reading.plain}</p>
    </div>
  );
}

function ContextReading({ reading }: { reading: LiquidityReadingDto }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-zinc-900 dark:text-white">{reading.name}</div>
        <div className="text-xs text-zinc-500">{reading.plain}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">{fmt(reading)}</div>
        <div className={`text-xs tabular-nums ${TONE_TEXT[reading.tone]}`}>
          {reading.changePct3M >= 0 ? "+" : ""}
          {reading.changePct3M.toFixed(1)}% 3M
        </div>
      </div>
    </div>
  );
}

export default async function LiquidityPage() {
  let data: LiquidityDashboardDto | null = null;
  try {
    data = await api.getLiquidity();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Could not reach the RegimeDeck API. Make sure the backend is running.
        </p>
      </div>
    );
  }

  const warming = data.series.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Waves className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Global Liquidity</h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The tide under every risk asset. When the world&apos;s central banks are expanding money and
          credit, it tends to flow into stocks, gold and crypto first; when they drain it, the tide goes
          out. Here&apos;s where that tide stands — and how it has tracked Bitcoin and the S&amp;P.
        </p>
      </div>

      {warming ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-center text-sm text-amber-800 dark:text-amber-300">
          {data.note}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroReading reading={data.globalLiquidity} />
            <HeroReading reading={data.fedNetLiquidity} />
          </div>

          <LiquidityChart series={data.series} />

          {/* Plain-words guide to the chart */}
          <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <p className="flex items-start gap-2 leading-5">
                <span className="flex h-5 shrink-0 items-center">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700 dark:bg-emerald-600" />
                </span>
                <span>
                  <strong className="font-medium text-zinc-900 dark:text-white">Green</strong>{" "}
                  is liquidity — the money central banks have in the system (toggle Global vs US Fed net).
                </span>
              </p>
              <p className="flex items-start gap-2 leading-5">
                <span className="flex h-5 shrink-0 items-center">
                  <span className="h-2.5 w-2.5 rounded-sm bg-violet-600 dark:bg-violet-500" />
                </span>
                <span>
                  <strong className="font-medium text-zinc-900 dark:text-white">Purple</strong>{" "}
                  is the market — Bitcoin or the S&amp;P&nbsp;500 (toggle top-right).
                </span>
              </p>
            </div>
            <p>
              Both lines start at <strong className="font-medium text-zinc-900 dark:text-white">100</strong>, so
              their height is how much each has grown since the left edge — 200 is a double, 50 is a halving.
              That&apos;s what lets two very different scales — trillions of dollars and a price — share one axis.
            </p>
            <p>
              When they <strong className="font-medium text-zinc-900 dark:text-white">rise together</strong>,
              liquidity and the market are moving in step — the tide lifting the boats. When they{" "}
              <strong className="font-medium text-zinc-900 dark:text-white">drift apart</strong>, they&apos;ve
              decoupled, as they have recently. Hover any point to read the exact values.
            </p>
          </div>

          {/* Honest co-movement stats */}
          {data.overlays.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                How closely have they actually moved?
              </h2>
              <div className="mt-3 flex flex-wrap gap-6">
                {data.overlays.map((o) => (
                  <div key={o.symbol}>
                    <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                      {o.correlationPct >= 0 ? "+" : ""}
                      {o.correlationPct}%
                    </div>
                    <div className="text-xs text-zinc-500">
                      {o.symbol} · ~{Math.round(o.months / 12)}-yr correlation
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                Correlation of year-over-year liquidity <em>growth</em> with each asset&apos;s
                year-over-year return (not raw levels, which trend together and overstate the link).
                Positive and real — but loose, and the lead time wanders. Treat liquidity as the tide,
                not a timing signal.
              </p>
            </div>
          )}

          {/* Where the global number comes from */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
              <Droplets className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              What makes up global liquidity
            </h2>
            <div className="mt-3 space-y-2.5">
              {data.components.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{c.name}</span>
                    <span className="tabular-nums text-zinc-500">
                      ${c.valueUsdTrillions.toFixed(2)}T · {c.sharePct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.sharePct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              China&apos;s central bank isn&apos;t included yet — no clean free data source. It would add
              roughly another third again to the global total.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ContextReading reading={data.usM2} />
            <ContextReading reading={data.dollar} />
          </div>
        </>
      )}

      <p className="mx-auto max-w-3xl border-t border-zinc-200 dark:border-zinc-800 pt-4 text-center text-xs leading-relaxed text-zinc-500">
        {data.note}
      </p>

      <div className="text-center">
        <Link
          href="/playbook"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          See how each macro regime shapes what liquidity favors
        </Link>
      </div>
    </div>
  );
}
