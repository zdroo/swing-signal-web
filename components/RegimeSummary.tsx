import { ScrollText } from "lucide-react";
import { MarketHealth } from "@/components/MarketHealth";
import { Playbook } from "@/components/Playbook";
import type { MarketHealthDto, PlaybookDto } from "@/types";

// The backend-computed synthesis of the current indicator signals: the visual
// composition (groups → market health score) plus the plain-words narrative.
// Shared by the dashboard and /macro so the two never drift apart.
export function RegimeSummary({
  health,
  summary,
  playbook,
  title = "Current Market Conditions",
}: {
  health: MarketHealthDto;
  summary: string[];
  playbook?: PlaybookDto;
  title?: string;
}) {
  // A cached pre-upgrade API response can briefly lack these fields right
  // after a deploy — degrade to nothing rather than crash the page
  if (!health?.groups || !summary) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>

      <MarketHealth health={health} />

      <div className="mt-5 space-y-2">
        {summary.map((sentence, i) => (
          <p key={i} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {sentence}
          </p>
        ))}
      </div>
      {playbook && <Playbook playbook={playbook} />}

      <p className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs text-zinc-500">
        Generated automatically from the indicator signals — the same rules every time,
        no opinions. Not financial advice.
      </p>
    </section>
  );
}
