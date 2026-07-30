"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { SymbolSearchResultDto } from "@/types";
import { Loader2 } from "lucide-react";

// Debounced symbol search with a dropdown, for picking a ticker inline (no
// navigation). Same lookup as the analyze box; caller gets the chosen symbol.
export function SymbolAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Ticker",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [results, setResults] = useState<SymbolSearchResultDto[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Clearing on short input lives in the change handler; the effect only fetches.
  const handleChange = (v: string) => {
    onChange(v);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
    }
  };

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      api
        .searchSymbols(q)
        .then((r) => {
          if (cancelled) return;
          setResults(r);
          setOpen(r.length > 0);
          setHighlighted(-1);
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (symbol: string) => {
    onChange(symbol);
    onSelect?.(symbol);
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? results.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0 && results[highlighted]) {
      e.preventDefault();
      choose(results[highlighted].symbol);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {searching && (
        <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
          {results.map((r, i) => (
            <li key={`${r.symbol}-${i}`}>
              <button
                type="button"
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => choose(r.symbol)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                <span className="min-w-16 font-semibold text-zinc-900 dark:text-white">{r.symbol}</span>
                <span className="flex-1 truncate text-zinc-600 dark:text-zinc-400">{r.name}</span>
                <span className="text-[10px] text-zinc-400">{r.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
