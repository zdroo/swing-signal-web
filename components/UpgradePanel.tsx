"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { track } from "@/lib/analytics";
import { Check, Loader2, Sparkles } from "lucide-react";

// Yearly is ~2 months free vs monthly ($99 vs $168) — mirror the Stripe prices
const MONTHLY = 14;
const YEARLY = 99;

const FEATURES = [
  "Watchlist — all your assets, odds and statistical read on one screen",
  "Change alerts — email when a read flips or Market Health shifts",
  "Weekly regime report every Monday",
  "Unlimited custom prediction windows",
  "On-demand backtests with your own parameters",
];

export function UpgradePanel({ source }: { source: string }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    track("upgrade_click", { source, period });
    try {
      const { url } = await api.createCheckout(period);
      window.location.href = url; // hand off to Stripe's hosted checkout
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start checkout. Try again shortly.");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Upgrade to Pro</h2>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        The odds engine stays free forever. Pro adds automation on top — never better numbers, just
        the convenience of being told when they change.
      </p>

      <ul className="mt-4 space-y-2">
        {FEATURES.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>

      {/* Period toggle */}
      <div className="mt-5 inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 p-0.5">
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "monthly"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setPeriod("yearly")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "yearly"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Yearly <span className="text-xs opacity-80">· save ~40%</span>
        </button>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-zinc-900 dark:text-white">
          ${period === "monthly" ? MONTHLY : YEARLY}
        </span>
        <span className="text-sm text-zinc-500">/ {period === "monthly" ? "month" : "year"}</span>
        {period === "yearly" && (
          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
            ${(YEARLY / 12).toFixed(2)}/mo, billed annually
          </span>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {user ? (
        <button
          type="button"
          onClick={startCheckout}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to checkout
        </button>
      ) : (
        <Link
          href="/auth?returnTo=%2Faccount"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Sign in to upgrade
        </Link>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        Secure checkout by Stripe. Cancel anytime — you keep Pro until the period ends.
      </p>
    </div>
  );
}
