"use client";

import { useState } from "react";
import { InfoTip } from "@/components/InfoTip";
import type { AssetOddsDto, OddsForPeriodDto } from "@/types";
import { Calculator } from "lucide-react";

// Sizes a position so that if the asset repeats its worst analog outcome in
// regimes like today, the loss stays within the user's risk budget. Reuses the
// odds already on the page (currentPrice + per-horizon worstCase) — no fetch.

const HORIZONS: { label: string; key: keyof AssetOddsDto }[] = [
  { label: "1 month", key: "oneMonth" },
  { label: "3 months", key: "threeMonths" },
  { label: "6 months", key: "sixMonths" },
];

const inputCls =
  "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm tabular-nums text-zinc-900 dark:text-white";

function usd(v: number) {
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

export function PositionSizer({ odds }: { odds: AssetOddsDto }) {
  const [account, setAccount] = useState("");
  const [riskPct, setRiskPct] = useState("2");

  const acct = Number(account);
  const risk = Number(riskPct);
  const riskBudget = acct > 0 && risk > 0 ? (acct * risk) / 100 : 0;

  const rows = HORIZONS.map((h) => {
    const d = odds[h.key] as OddsForPeriodDto;
    const downside = d.worstCase < 0 ? -d.worstCase : 0;
    const maxPos = riskBudget > 0 && downside > 0 ? (riskBudget * 100) / downside : null;
    return {
      label: h.label,
      worst: d.worstCase,
      maxPos,
      pctAcct: maxPos && acct > 0 ? (maxPos / acct) * 100 : null,
    };
  });

  const primary = rows[1]; // 3-month

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
        <Calculator className="h-4 w-4 text-zinc-500" />
        Position sizer
        <InfoTip align="left">
          Sizes {odds.symbol} so that if it repeats its worst analog outcome in regimes like today, your
          loss stays within the risk budget you set. Risk math, not advice — a historical worst case can
          always be exceeded.
        </InfoTip>
      </h2>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="mr-2">Account size</span>
          <span className="relative inline-block">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="10,000"
              className={`${inputCls} w-32 pl-6`}
            />
          </span>
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="mr-2">Risk per trade</span>
          <input
            value={riskPct}
            onChange={(e) => setRiskPct(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            className={`${inputCls} w-16`}
          />
          <span className="ml-1">% of account</span>
        </label>
      </div>

      {riskBudget <= 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Enter your account size to size a position.</p>
      ) : primary.maxPos ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            To risk no more than <span className="font-semibold">{usd(riskBudget)}</span> on{" "}
            <span className="font-semibold">{odds.symbol}</span>, keep the position under{" "}
            <span className="font-semibold text-zinc-900 dark:text-white">{usd(primary.maxPos)}</span>
            {primary.pctAcct != null && <> ({primary.pctAcct.toFixed(0)}% of your account)</>}. If it
            repeats its worst 3-month analog ({primary.worst.toFixed(1)}%), that&apos;s roughly your
            whole risk budget.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-zinc-500">
                  <th className="py-2 text-left">Horizon</th>
                  <th className="py-2 text-right">Worst analog</th>
                  <th className="py-2 text-right">Max position</th>
                  <th className="py-2 text-right">% of account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">{r.label}</td>
                    <td className="py-2 text-right tabular-nums text-red-600 dark:text-red-400">
                      {r.worst.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-900 dark:text-white">
                      {r.maxPos ? usd(r.maxPos) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-500">
                      {r.pctAcct != null ? `${r.pctAcct.toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          No historical 3-month drawdown for {odds.symbol} in these analogs — size against your own stop
          instead.
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        Sizes against the regime worst case so the realistic downside stays within your budget. Not
        financial advice; worst cases can be exceeded.
      </p>
    </div>
  );
}
