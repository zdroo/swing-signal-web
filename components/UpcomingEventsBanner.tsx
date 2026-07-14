"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { EconomicEventDto } from "@/types";
import { CalendarClock } from "lucide-react";

// These are pure calendar dates — parse the YYYY-MM-DD parts directly so no
// timezone conversion can shift them a day (the API sends them zoneless).
function calendarUtc(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((calendarUtc(dateStr) - today) / 86_400_000);
}

function whenLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

// A quiet heads-up so users don't trade blind into a market-moving release.
// Fetches client-side and renders nothing if there's no data (fail-soft), so
// it's safe to drop onto any page.
export function UpcomingEventsBanner() {
  const [events, setEvents] = useState<EconomicEventDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getUpcomingEvents(3)
      .then((r) => !cancelled && setEvents(r.events))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!events || events.length === 0) return null;

  const next = events[0];
  const days = daysUntil(next.date);
  const dateLabel = new Date(calendarUtc(next.date)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  // The one or two after the headline, for context
  const rest = events.slice(1, 3);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm">
      <CalendarClock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="text-zinc-700 dark:text-zinc-300">
        Next high-impact release:{" "}
        <span className="font-medium text-zinc-900 dark:text-white">{next.title}</span>{" "}
        <span className="text-amber-700 dark:text-amber-400">{whenLabel(days)}</span>{" "}
        <span className="text-zinc-500">({dateLabel})</span>
      </span>
      {rest.length > 0 && (
        <span className="text-xs text-zinc-500">
          · then {rest.map((e) => e.title).join(", ")}
        </span>
      )}
    </div>
  );
}
