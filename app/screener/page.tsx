"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PRO_ENABLED } from "@/lib/features";
import { ScreenerTable } from "@/components/ScreenerTable";
import { SectorHeatmap } from "@/components/SectorHeatmap";
import { ProWaitlist } from "@/components/ProWaitlist";
import { UpgradePanel } from "@/components/UpgradePanel";
import { InfoTip } from "@/components/InfoTip";
import type { ScreenerResultDto, SectorRotationResultDto } from "@/types";
import { Loader2, Radar, Lock, Grid3x3 } from "lucide-react";

const STANCES = ["Long bias", "No edge", "Stand aside"];
const MARKETS = ["Crypto", "Index", "Stock", "Commodity", "Forex"];

export default function ScreenerPage() {
  const { user, loading: authLoading } = useAuth();
  const isPro = user?.plan === "Pro";

  const [result, setResult] = useState<ScreenerResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<SectorRotationResultDto | null>(null);
  const [stance, setStance] = useState("");
  const [market, setMarket] = useState("");

  // Loading is derived from a key mismatch, so the effect never sets state
  // synchronously (which would trigger cascading renders).
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const requestKey = `${isPro}|${stance}|${market}`;
  const loading = authLoading || loadedKey !== requestKey;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      try {
        let data: ScreenerResultDto;
        try {
          data = isPro
            ? await api.getScreenerFull({ stance: stance || undefined, market: market || undefined })
            : await api.getScreener();
        } catch (err) {
          // A Pro user whose token hasn't refreshed yet can 403 on /full —
          // fall back to the free board rather than error out
          if (err instanceof ApiError && err.status === 403) data = await api.getScreener();
          else throw err;
        }
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load the screener. Try again shortly.");
      } finally {
        if (!cancelled) setLoadedKey(requestKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isPro, stance, market, requestKey]);

  // Sector rotation is independent of the screener filters — fetch once. It's
  // enrichment, so a failure just hides the section rather than erroring.
  useEffect(() => {
    let cancelled = false;
    api.getSectors().then((r) => !cancelled && setSectors(r)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white">
          <Radar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Regime Screener
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every asset ranked by the edge the current macro regime adds — the asset page&apos;s
          verdict, computed across the board so you don&apos;t check tickers one at a time.
        </p>
      </div>

      {/* Pro filters */}
      {isPro && (
        <div className="flex flex-wrap gap-2">
          <select
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <option value="">All stances</option>
            {STANCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <option value="">All markets</option>
            {MARKETS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-600" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : result ? (
        <>
          <ScreenerTable rows={result.rows} />

          {result.asOf && (
            <p className="text-xs text-zinc-500">
              As of{" "}
              {new Date(result.asOf).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
              {" · "}
              same engine and honesty rules as each asset page — not a prediction.
            </p>
          )}

          {/* Trimmed = free teaser: show what's locked + the upgrade path */}
          {result.trimmed && (
            <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Showing {result.rows.length} of {result.universeSize} assets
                </p>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Pro unlocks the full board plus stance, market and edge filters.
              </p>
              <div className="mt-4">
                {PRO_ENABLED ? (
                  <UpgradePanel source="screener-gate" />
                ) : (
                  <div className="max-w-md">
                    <ProWaitlist source="screener-gate" />
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-600">
            Historical data only. Descriptive statistics, not financial advice.
          </p>
        </>
      ) : null}

      {/* Sector rotation — the same regime edge, aggregated to the 11 S&P sectors */}
      {sectors && sectors.sectors.length > 0 && (
        <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
              <Grid3x3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Sector Rotation
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              The same regime edge, aggregated to the 11 S&amp;P sectors — which the macro regime favors,
              and which are actually leading the market right now.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-white">Regime edge</span>
              <InfoTip align="left">
                How many percentage points the current macro regime adds to the sector ETF&apos;s
                3-month odds versus its all-time base rate. Tiles are tinted by this — green means the
                regime favors the sector, red a headwind. The same edge as on every asset page.
              </InfoTip>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-white">Relative strength</span>
              <InfoTip align="left">
                The sector&apos;s ~3-month return minus the broad market&apos;s (SPY): positive means it&apos;s
                outpacing the market (money rotating in), negative means it&apos;s lagging even if it still
                rose. Where money is actually moving — separate from the macro regime.
              </InfoTip>
            </span>
          </div>

          <SectorHeatmap sectors={sectors.sectors} benchmark={sectors.benchmark} />

          {sectors.asOf && (
            <p className="text-xs text-zinc-500">
              As of{" "}
              {new Date(sectors.asOf).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
              {" · "}
              regime edge from the same engine as each asset page — descriptive, not a prediction.
            </p>
          )}
        </section>
      )}

      <Link
        href="/macro"
        className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        See the macro conditions driving these reads →
      </Link>
    </div>
  );
}
