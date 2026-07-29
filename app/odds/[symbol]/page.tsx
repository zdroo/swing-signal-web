"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { track } from "@/lib/analytics";
import { useAuth } from "@/context/AuthContext";
import { OddsTable } from "@/components/OddsTable";
import { AssetSearch } from "@/components/AssetSearch";
import { ConfidenceRisk } from "@/components/ConfidenceRisk";
import { AnalogContext } from "@/components/AnalogContext";
import { BacktestPanel } from "@/components/BacktestPanel";
import { PriceChart } from "@/components/PriceChart";
import { TradeReadCard } from "@/components/TradeReadCard";
import { UpcomingEventsBanner } from "@/components/UpcomingEventsBanner";
import { AccuracyTrustLine } from "@/components/AccuracyTrustLine";
import { ProWaitlist } from "@/components/ProWaitlist";
import { InfoTip } from "@/components/InfoTip";
import { AlertCircle, ArrowLeft, Info, Loader2, Lock } from "lucide-react";
import type { AssetOddsDto } from "@/types";
import { formatPrice } from "@/lib/format";

function SignupGate({ symbol }: { symbol: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
      <Lock className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
        {symbol} analysis is an account feature
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        BTC, SPY and Gold are free without an account. To analyze any other symbol,
        create a free account. Takes 20 seconds.
      </p>
      <Link
        href={`/auth?returnTo=${encodeURIComponent(`/odds/${symbol}`)}`}
        className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
      >
        Create free account
      </Link>
    </div>
  );
}

export default function OddsPage() {
  const params = useParams<{ symbol: string }>();
  const searchParams = useSearchParams();
  const symbol = decodeURIComponent(params.symbol);
  const { user, loading: authLoading } = useAuth();

  // One keyed result instead of separate loading/gated/error flags: "loading"
  // is derived (the stored key doesn't match the requested one yet), so the
  // effect never needs to reset state synchronously.
  type OddsResult =
    | { key: string; kind: "data"; odds: AssetOddsDto }
    | { key: string; kind: "gated" }
    | { key: string; kind: "error"; message: string };

  const [result, setResult] = useState<OddsResult | null>(null);
  const requestKey = `${symbol}|${user?.email ?? ""}`;

  useEffect(() => {
    if (authLoading) return; // wait until the token is loaded so the fetch carries it

    let cancelled = false;

    api
      .getAssetOdds(symbol, {
        q: searchParams.get("q") ?? undefined,
        src: searchParams.get("src") ?? undefined,
      })
      .then((r) => {
        if (!cancelled) setResult({ key: requestKey, kind: "data", odds: r });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setResult({ key: requestKey, kind: "gated" });
          track("gate_hit", { gate: "symbol", symbol });
        } else {
          setResult({
            key: requestKey,
            kind: "error",
            message: `Could not load odds for "${symbol}". New symbols take a few seconds to fetch — try again shortly.`,
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, authLoading]);

  const loading = authLoading || result?.key !== requestKey;
  const gated = !loading && result?.kind === "gated";
  const error = !loading && result?.kind === "error" ? result.message : null;
  const odds = !loading && result?.kind === "data" ? result.odds : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Search another asset</h2>
        <AssetSearch />
      </section>

      {loading || authLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-600" />
        </div>
      ) : gated ? (
        <SignupGate symbol={symbol} />
      ) : error ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">{error}</p>
        </div>
      ) : odds ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{odds.name || symbol}</h1>
              <p className="mt-0.5 text-sm text-zinc-500">{symbol}</p>
            </div>
            {odds.currentPrice !== null && (
              <div className="text-right">
                <div className="text-xs text-zinc-500">Current Price</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                  {odds.currentPrice !== null ? formatPrice(odds.currentPrice, symbol) : "—"}
                </div>
                <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-zinc-500">
                  <span>Based on {odds.matchesUsed} historical macro periods</span>
                  <InfoTip align="right">
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      What are &quot;historical macro periods&quot;?
                    </p>
                    <p className="mt-1.5">
                      Every month since 1990 gets a fingerprint of 26 macro indicators (Fed policy,
                      yield curve, inflation, credit stress...). We pick the {odds.matchesUsed} months
                      whose fingerprints most resemble today&apos;s — deduplicated so one crisis
                      can&apos;t fill the list — and weight them by closeness.
                    </p>
                    <p className="mt-1.5">
                      The odds on this page are simply what {odds.symbol} did in the weeks and months
                      after those moments. The matching uses <span className="font-medium">macro conditions
                      only</span> — not the asset&apos;s own chart — so check the &quot;Same Macro,
                      Different Price Situations&quot; box below for how the asset&apos;s own position
                      varied across these periods.
                    </p>
                    <p className="mt-1.5">
                      For crypto assets, matching focuses on liquidity, risk-appetite and crypto
                      cycle gauges, with short and long horizons matched separately — validated
                      improvements in walk-forward testing.
                    </p>
                  </InfoTip>
                </div>
              </div>
            )}
          </div>

          {/* Heads-up on any market-moving macro release coming up */}
          <UpcomingEventsBanner />

          {/* The takeaway first: what the analog statistics support right now */}
          {odds.tradeRead && <TradeReadCard read={odds.tradeRead} />}

          {/* Confidence + downside before any odds — leans and risk, not forecasts */}
          <ConfidenceRisk matchesUsed={odds.matchesUsed} threeMonth={odds.threeMonths} symbol={odds.symbol} />

          {/* Trust at the point of decision — points to the backtest below */}
          <AccuracyTrustLine matchesUsed={odds.matchesUsed} />

          <PriceChart
            symbol={odds.symbol}
            analogs={odds.breakdown?.points}
            currentAboveMa200={odds.breakdown?.currentAboveMa200 ?? null}
          />

          {odds.breakdown && <AnalogContext breakdown={odds.breakdown} symbol={odds.symbol} />}

          <div id="backtest" className="scroll-mt-20">
            <BacktestPanel symbol={odds.symbol} />
          </div>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-white">
              How {odds.name || symbol} behaved when the macro looked like today
            </h2>
            <p className="mb-3 text-sm text-zinc-500">
              Odds, returns and the outcome range across the analog periods — descriptive statistics,
              not price targets. Read the Worst Case row as your realistic downside.
            </p>
            <OddsTable odds={odds} />
          </section>

          {odds.explanations.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Why — Macro Context</h2>
              <div className="space-y-3">
                {odds.explanations.map((bullet, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{bullet}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <ProWaitlist source="odds-page" />

          <p className="text-xs text-zinc-500 dark:text-zinc-600">{odds.disclaimer}</p>
        </>
      ) : null}
    </div>
  );
}
