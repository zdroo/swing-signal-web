// Shared display helpers so the stance chips and the sign-coloring look the
// same everywhere (screener, sectors, watchlist, statistical read).

const STANCE_CHIP: Record<string, string> = {
  "Long bias": "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400",
  "No edge": "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  "Stand aside": "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-400",
};

/// Chip classes for a statistical-read stance, falling back to the neutral
/// style for an unknown/absent stance.
export function stanceChip(stance: string): string {
  return STANCE_CHIP[stance] ?? STANCE_CHIP["No edge"];
}

/// Emerald for non-negative, red for negative — the sign convention used for
/// edge, returns and relative strength throughout the app.
export function signColor(value: number): string {
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
}
