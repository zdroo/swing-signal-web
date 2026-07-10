import { ScrollText } from "lucide-react";
import { summarizeRegime } from "@/lib/regime-insight";
import type { MacroIndicatorValueDto } from "@/types";

// The rule-based plain-words synthesis of the current indicator signals.
// Shared by the dashboard and /macro so the two never drift apart.
export function RegimeSummary({
  indicators,
  title = "The Picture Right Now",
}: {
  indicators: Record<string, MacroIndicatorValueDto>;
  title?: string;
}) {
  const summary = summarizeRegime(indicators);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="mb-3 flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-2">
        {summary.map((sentence, i) => (
          <p key={i} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {sentence}
          </p>
        ))}
      </div>
      <p className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs text-zinc-500">
        Generated automatically from the indicator signals above. Not financial advice.
      </p>
    </section>
  );
}
