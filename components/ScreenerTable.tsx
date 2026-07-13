import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ScreenerRowDto } from "@/types";

const STANCE_CHIP: Record<string, string> = {
  "Long bias": "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  "No edge": "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  "Stand aside": "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
};

export function ScreenerTable({ rows }: { rows: ScreenerRowDto[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center text-sm text-zinc-500">
        The board is still computing — check back in a few minutes.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-160 bg-white dark:bg-zinc-900 text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">3M Odds</th>
            <th className="px-4 py-3 font-medium">Edge</th>
            <th className="px-4 py-3 font-medium">Statistical Read</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
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
                {row.stance ? (
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-xs font-medium ${
                      STANCE_CHIP[row.stance] ?? STANCE_CHIP["No edge"]
                    }`}
                  >
                    {row.stance}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">pending data</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
