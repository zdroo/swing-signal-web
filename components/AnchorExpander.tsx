"use client";

import { useEffect } from "react";

// Companion for pages that put anchor targets inside collapsed <details>:
// navigating to #some-id opens every <details> ancestor first, then scrolls.
// Without this, table-of-contents links into a closed section do nothing.
export function AnchorExpander() {
  useEffect(() => {
    const openTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;

      let details = el.closest("details");
      while (details) {
        details.open = true;
        details = details.parentElement?.closest("details") ?? null;
      }
      el.scrollIntoView({ block: "start" });
    };

    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, []);

  return null;
}
