"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

const BALLOON_MAX_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

// Info balloon that works for every input type: hover on mouse, tap on touch
// (tap again / outside / Escape closes). The balloon is position:fixed and
// clamped to the viewport, so it also survives overflow-x scroll containers.
// A custom `trigger` turns any element (a table chip, a badge) into the
// tappable info surface; default is the ℹ icon.
export function InfoTip({
  children,
  align = "center",
  trigger,
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const lastPointerType = useRef<string>("mouse");

  const show = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(BALLOON_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    let left =
      align === "left" ? rect.left
      : align === "right" ? rect.right - width
      : rect.left + rect.width / 2 - width / 2;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN));

    setPos({ top: rect.bottom + 6, left, width });
    setOpen(true);
  }, [align]);

  useEffect(() => {
    if (!open) return;

    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // A fixed-position balloon would drift from its trigger — close instead
    const onMove = () => setOpen(false);

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="inline-flex align-middle"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") show();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="More information"
        className="inline-flex cursor-help items-center"
        onPointerDown={(e) => {
          lastPointerType.current = e.pointerType;
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Mouse users already have hover; click-toggle is for touch/pen
          if (lastPointerType.current !== "mouse") {
            if (open) setOpen(false);
            else show();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open) setOpen(false);
            else show();
          }
        }}
      >
        {trigger ?? <Info className="h-3.5 w-3.5 text-zinc-400" />}
      </span>

      {open && pos && (
        <span
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
          className="z-50 block rounded-xl border border-zinc-300 bg-white p-4 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-zinc-600 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {children}
        </span>
      )}
    </span>
  );
}
