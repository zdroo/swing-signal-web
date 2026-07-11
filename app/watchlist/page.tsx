"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ProWaitlist } from "@/components/ProWaitlist";
import { UpgradePanel } from "@/components/UpgradePanel";
import { PRO_ENABLED } from "@/lib/features";
import { formatPrice } from "@/lib/format";
import type { TradeStance, WatchlistRowDto } from "@/types";
import { Eye, Loader2, Lock, Plus, X } from "lucide-react";

const MAX_ITEMS = 15; // mirrors WatchlistService.MaxItems

const STANCE_CHIP: Record<TradeStance, string> = {
  "Long bias": "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  "No edge": "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  "Stand aside": "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
};

function ProGate() {
  // Once Pro is live, the gate sells the upgrade; while dark, it collects
  // waitlist interest (only a manually-upgraded Pro account can even see the
  // tab yet, so a Free user reaching this URL is a curious early visitor)
  if (PRO_ENABLED) {
    return (
      <div>
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 px-6 py-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            The watchlist is a Pro feature
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            All your assets with today&apos;s odds, edge and statistical read on one screen.
          </p>
        </div>
        <UpgradePanel source="watchlist-gate" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
      <Lock className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
        The watchlist is a Pro feature
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        All your assets with today&apos;s odds, edge and statistical read on one
        screen. Join the waitlist and we&apos;ll tell you the moment Pro is live.
      </p>
      <div className="mx-auto mt-6 max-w-md">
        <ProWaitlist source="watchlist-gate" />
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();

  const [rows, setRows] = useState<WatchlistRowDto[] | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    api
      .getWatchlistOverview()
      .then((r) => {
        if (cancelled) return;
        setRows(r);
        setGated(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) setGated(true);
        else setError("Could not load your watchlist. Try again shortly.");
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const add = async () => {
    const trimmed = symbol.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const item = await api.addToWatchlist(trimmed);
      setSymbol("");

      // One odds fetch for the new asset instead of recomputing the whole
      // overview — the other rows haven't changed
      let row: WatchlistRowDto = {
        symbol: item.symbol,
        name: item.name,
        currentPrice: null,
        odds3M: null,
        baseRate3M: null,
        edge3M: null,
        tradeRead: null,
        addedAt: item.addedAt,
      };
      try {
        const odds = await api.getAssetOdds(item.symbol);
        const hasOdds = odds.threeMonths.totalCases > 0;
        row = {
          ...row,
          currentPrice: odds.currentPrice,
          odds3M: hasOdds ? odds.threeMonths.positiveOdds : null,
          baseRate3M: hasOdds ? odds.threeMonths.baseRate : null,
          edge3M: hasOdds ? odds.threeMonths.edge : null,
          tradeRead: odds.tradeRead,
        };
      } catch {
        // name-only row now; the next full load fills it in
      }
      setRows((r) => [...(r ?? []), row]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the symbol.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (sym: string) => {
    setError(null);
    try {
      await api.removeFromWatchlist(sym);
      setRows((r) => r?.filter((row) => row.symbol !== sym) ?? null);
    } catch {
      setError(`Could not remove ${sym}.`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Eye className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Watchlist</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to see your watchlist.
        </p>
        <Link
          href="/auth?returnTo=%2Fwatchlist"
          className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white">
          <Eye className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Watchlist
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your assets with today&apos;s odds, edge and statistical read — the same
          numbers as each asset page, on one screen.
        </p>
      </div>

      {gated ? (
        <ProGate />
      ) : (
        <>
          {/* Add form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Add a symbol... BTCUSDT, SPY, GLD"
              className="w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 sm:text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={add}
              disabled={busy || !symbol.trim() || (rows?.length ?? 0) >= MAX_ITEMS}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {rows === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-600" />
            </div>
          ) : rows.length === 0 && !error ? (
            <p className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center text-sm text-zinc-500">
              Your watchlist is empty — add a symbol above to start tracking it.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-160 bg-white dark:bg-zinc-900 text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Asset</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">3M Odds</th>
                    <th className="px-4 py-3 font-medium">Edge</th>
                    <th className="px-4 py-3 font-medium">Statistical Read</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.symbol}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/odds/${encodeURIComponent(row.symbol)}`}
                          className="font-medium text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {row.symbol}
                        </Link>
                        <span className="ml-2 hidden text-xs text-zinc-500 md:inline">{row.name}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {row.currentPrice !== null ? formatPrice(row.currentPrice, row.symbol) : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {row.odds3M !== null ? `${row.odds3M.toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.edge3M !== null ? (
                          <span
                            className={
                              row.edge3M >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {row.edge3M >= 0 ? "+" : ""}
                            {row.edge3M.toFixed(1)}pp
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.tradeRead ? (
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-xs font-medium ${STANCE_CHIP[row.tradeRead.stance]}`}
                          >
                            {row.tradeRead.stance}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">pending data</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(row.symbol)}
                          aria-label={`Remove ${row.symbol}`}
                          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows !== null && rows.length > 0 && (
            <p className="text-xs text-zinc-500">
              {rows.length} of {MAX_ITEMS} slots used. Odds refresh on every visit —
              same engine, same honesty rules as the asset pages.
            </p>
          )}
        </>
      )}
    </div>
  );
}
