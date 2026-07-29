import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { RegimePlaybookCard } from "@/components/RegimePlaybookCard";
import type { RegimePlaybookBoardDto } from "@/types";
import { AlertCircle, ArrowLeft, BookOpen, Clock, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Regime Playbook",
  description:
    "What each macro regime has historically favored across stocks, crypto, gold, bonds and cash — with the regime today's readings sit closest to highlighted. Rule-based, not predictions.",
  alternates: { canonical: "/playbook" },
};

export default async function PlaybookPage() {
  let board: RegimePlaybookBoardDto | null = null;
  try {
    board = await api.getRegimePlaybooks();
  } catch {
    board = null;
  }

  if (!board) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Could not reach the RegimeDeck API. Make sure the backend is running.
        </p>
      </div>
    );
  }

  // Current regime leads (featured); the rest keep catalog order below it.
  const current = board.regimes.find((r) => r.isCurrent) ?? null;
  const rest = board.regimes.filter((r) => r.id !== current?.id);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Regime Playbook</h1>
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The economy moves through a handful of repeating conditions — we call them regimes. Each one
          has historically been kind to some investments and rough on others. Here&apos;s the playbook for
          each, and which one today&apos;s economy looks most like.
        </p>
      </div>

      <div className="mx-auto flex max-w-3xl gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-white">How to read this — think weeks to months, not days.</span>{" "}
          These are allocation leans, not timed trades. The idea is to tilt toward what a regime favors
          while the economy is in it, and rotate when it shifts to a different regime — in practice, when
          the highlighted &ldquo;now&rdquo; regime below changes. It&apos;s the backdrop, not a precise
          buy/sell trigger; for entry odds and price targets on a specific asset, open its{" "}
          <Link href="/dashboard" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            odds page
          </Link>
          .
        </div>
      </div>

      {current ? (
        <div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              The economy right now
            </h2>
            <p className="mx-auto mb-4 mt-1 max-w-2xl text-sm text-zinc-500">
              Today&apos;s macro readings look most like the regime below. This is what similar conditions
              have historically favored — a starting point, not a forecast.
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <RegimePlaybookCard regime={current} featured />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm text-amber-800 dark:text-amber-300">
          The live regime is still warming up (macro data is loading), so today isn&apos;t matched to a
          regime yet. The full playbook for every regime is below.
        </div>
      )}

      <div>
        <div className="text-center">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {current ? "What tends to work in every other regime" : "Every regime"}
          </h2>
          <p className="mx-auto mb-4 mt-1 max-w-2xl text-sm text-zinc-500">
            Conditions shift over time. These are the playbooks for the other regimes, so you can see what
            has historically done well — and badly — when the economic weather changes.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {rest.map((regime) => (
            <RegimePlaybookCard key={regime.id} regime={regime} />
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 text-center">
        <p className="mx-auto max-w-3xl text-xs leading-relaxed text-zinc-500">{board.note}</p>
        <Link
          href="/macro"
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <BookOpen className="h-4 w-4" />
          See the live indicators behind today&apos;s regime
        </Link>
      </div>
    </div>
  );
}
