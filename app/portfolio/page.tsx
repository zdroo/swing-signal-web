"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { InfoTip } from "@/components/InfoTip";
import type { HoldingXrayDto, PortfolioXrayDto } from "@/types";
import { ArrowLeft, Lock, Loader2, Plus, Scan, Trash2 } from "lucide-react";

type Row = { symbol: string; value: string };

function ret(v: number) {
  return v > 0 ? "text-emerald-600 dark:text-emerald-400" : v < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500";
}
function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

const CONF_CHIP: Record<string, string> = {
  "Very low": "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400",
  Low: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
  Modest: "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
};

const CONC_CHIP: Record<string, string> = {
  Concentrated: "border-red-400/40 bg-red-400/10 text-red-700 dark:text-red-400",
  Moderate: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
  Diversified: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
};

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([
    { symbol: "", value: "" },
    { symbol: "", value: "" },
  ]);
  const [result, setResult] = useState<PortfolioXrayDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { symbol: "", value: "" }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));

  const holdings = rows
    .map((r) => ({ symbol: r.symbol.trim().toUpperCase(), value: Number(r.value) }))
    .filter((h) => h.symbol && h.value > 0);

  async function run() {
    if (holdings.length === 0) {
      setError("Add at least one holding with a dollar value.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await api.getPortfolioXray(holdings));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not analyze the portfolio. Try again shortly.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Scan className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Portfolio Macro X-Ray</h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Enter your holdings and see your true macro exposure — how risk-on you really are, how
          concentrated, how tied to global liquidity, and how a book like yours has fared after regimes
          like today. A mirror, not a forecast.
        </p>
      </div>

      {authLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : !user ? (
        <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <Lock className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            The X-Ray is a free account feature
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Create a free account to analyze your portfolio. We never store your holdings — they&apos;re
            analyzed and discarded.
          </p>
          <Link
            href="/auth?returnTo=/portfolio"
            className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Create free account
          </Link>
        </div>
      ) : (
        <>
          {/* Holdings input */}
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Your holdings</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ticker + dollar value (e.g. SPY 12000, BTCUSDT 4000, GLD 3000). Weights are computed for you.
            </p>
            <div className="mt-3 space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={r.symbol}
                    onChange={(e) => setRow(i, { symbol: e.target.value })}
                    placeholder="Ticker"
                    className="w-40 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm uppercase text-zinc-900 dark:text-white placeholder:normal-case placeholder:text-zinc-400"
                  />
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                    <input
                      value={r.value}
                      onChange={(e) => setRow(i, { value: e.target.value.replace(/[^\d.]/g, "") })}
                      inputMode="decimal"
                      placeholder="Value"
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-1.5 pl-7 pr-3 text-sm tabular-nums text-zinc-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    aria-label="Remove holding"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add holding
              </button>
              <button
                type="button"
                onClick={run}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                Run X-Ray
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </section>

          {result && <Results data={result} />}
        </>
      )}
    </div>
  );
}

function Results({ data }: { data: PortfolioXrayDto }) {
  const { outcome, exposure, concentration, holdings } = data;

  return (
    <div className="space-y-6">
      {/* Outcome headline */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-zinc-500">A book like yours, in regimes like today</h2>
          <InfoTip align="left">
            The 3-month outcomes of a portfolio with your exact weights across the historical months whose
            macro resembled today&apos;s — date-aligned, so diversification counts. A small, overlapping
            sample: risk and lean, not a forecast.
          </InfoTip>
          {outcome.analogs > 0 && (
            <span className={`ml-auto rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${CONF_CHIP[outcome.confidence] ?? CONF_CHIP.Modest}`}>
              {outcome.confidence} confidence · {outcome.analogs} analogs
            </span>
          )}
        </div>

        {outcome.analogs === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Not enough overlapping history across these holdings to build a portfolio outcome yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-4">
            <Stat label="Median 3M" value={pct(outcome.medianReturn)} tone={ret(outcome.medianReturn)} big />
            <Stat label="Worst analog" value={pct(outcome.worstReturn)} tone="text-red-600 dark:text-red-400" />
            <Stat label="Best analog" value={pct(outcome.bestReturn)} tone="text-emerald-600 dark:text-emerald-400" />
            <Stat label="Ended positive" value={`${outcome.positiveOddsPct.toFixed(0)}%`} tone="text-zinc-900 dark:text-white" />
          </div>
        )}
      </section>

      {/* Exposure */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Exposure</h2>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-medium text-violet-600 dark:text-violet-400">Risk-on {exposure.riskOnPct.toFixed(0)}%</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Defensive {exposure.defensivePct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-violet-500" style={{ width: `${exposure.riskOnPct}%` }} />
          <div className="h-full bg-emerald-500" style={{ width: `${exposure.defensivePct}%` }} />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Liquidity sensitivity:</span>
          <span className="font-medium text-zinc-900 dark:text-white">{exposure.liquidityLabel}</span>
          <InfoTip align="left">
            How closely the book&apos;s returns have tracked global-liquidity swings (weighted across
            holdings). &quot;Liquidity-driven&quot; means the macro tide matters a lot here.
          </InfoTip>
        </div>

        <div className="mt-4 space-y-2">
          {concentration.byClass.map((c) => (
            <div key={c.assetClass}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-700 dark:text-zinc-300">{c.assetClass}</span>
                <span className="tabular-nums text-zinc-500">{c.weightPct.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.weightPct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Concentration */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Concentration</h2>
          <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${CONC_CHIP[concentration.label] ?? CONC_CHIP.Moderate}`}>
            {concentration.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Top holding is <span className="font-medium text-zinc-900 dark:text-white">{concentration.topWeightPct.toFixed(0)}%</span> of the
          book; the top three are <span className="font-medium text-zinc-900 dark:text-white">{concentration.top3Pct.toFixed(0)}%</span>.
        </p>
      </section>

      {/* Per-holding table */}
      <section className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 text-left">Holding</th>
              <th className="px-4 py-3 text-right">Weight</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-right">Median 3M</th>
              <th className="px-4 py-3 text-right">Worst 3M</th>
              <th className="px-4 py-3 text-right">Volatility</th>
              <th className="px-4 py-3 text-right">Liquidity β</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {holdings.map((h) => (
              <HoldingRow key={h.symbol} h={h} />
            ))}
          </tbody>
        </table>
      </section>

      {/* Reads */}
      {data.reads.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">What this says</h2>
          <ul className="mt-3 space-y-2">
            {data.reads.map((r) => (
              <li key={r} className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs leading-relaxed text-zinc-500">{data.note}</p>
    </div>
  );
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone: string; big?: boolean }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`${big ? "text-2xl" : "text-xl"} font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function HoldingRow({ h }: { h: HoldingXrayDto }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-medium text-zinc-900 dark:text-white">{h.symbol}</div>
        <div className="text-xs text-zinc-500">{h.posture}</div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{h.weightPct.toFixed(0)}%</td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{h.assetClass}</td>
      <td className={`px-4 py-3 text-right tabular-nums ${ret(h.medianReturn3M)}`}>{pct(h.medianReturn3M)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">{pct(h.worstReturn3M)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
        {h.volatilityPct === null ? "—" : `${h.volatilityPct.toFixed(0)}%`}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-500">{h.liquidityBeta === null ? "—" : h.liquidityBeta}</td>
    </tr>
  );
}
