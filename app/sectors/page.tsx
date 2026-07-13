"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { SectorHeatmap } from "@/components/SectorHeatmap";
import { InfoTip } from "@/components/InfoTip";
import type { SectorRotationResultDto } from "@/types";
import { Loader2, Grid3x3 } from "lucide-react";

export default function SectorsPage() {
  const [result, setResult] = useState<SectorRotationResultDto | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getSectors()
      .then((r) => !cancelled && setResult(r))
      .catch(() => !cancelled && setError("Could not load sectors. Try again shortly."))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white">
          <Grid3x3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Sector Rotation
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Which of the 11 S&amp;P sectors the current macro regime favors, and which are
          actually leading the market right now — the bridge between the macro picture and
          individual assets.
        </p>
      </div>

      {/* What the two numbers mean */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="font-semibold text-zinc-900 dark:text-white">Regime edge</span>
          <InfoTip align="left">
            How many percentage points the current macro regime adds to the sector ETF&apos;s
            3-month odds versus its all-time base rate. Tiles are tinted by this — green means the
            regime favors the sector, red a headwind. It&apos;s the same edge as on every asset page.
          </InfoTip>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="font-semibold text-zinc-900 dark:text-white">Relative strength</span>
          <InfoTip align="left">
            How much the sector has out- or under-performed the benchmark over the last ~3 months —
            the momentum lens, i.e. where money is actually moving right now, regardless of the
            macro backdrop.
          </InfoTip>
        </span>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-600" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : result ? (
        <>
          <SectorHeatmap sectors={result.sectors} benchmark={result.benchmark} />

          {result.asOf && (
            <p className="text-xs text-zinc-500">
              As of{" "}
              {new Date(result.asOf).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
              {" · "}
              regime edge from the same engine as each asset page — descriptive, not a prediction.
            </p>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-600">
            Historical data only. Descriptive statistics, not financial advice.
          </p>
        </>
      ) : null}

      <Link
        href="/screener"
        className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        Screen individual assets by regime edge →
      </Link>
    </div>
  );
}
