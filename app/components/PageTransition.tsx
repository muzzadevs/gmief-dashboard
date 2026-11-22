"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState, useRef, useCallback } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page transition — blur overlay approach.
 *
 * Instead of blurring the content itself (which flashes because Next.js
 * swaps the page content before Framer Motion can finish exit), we render
 * a frost-glass overlay on top:
 *
 *   1. Route changes → overlay fades in with backdrop-blur  (0→1, 250ms)
 *   2. Under the overlay the new page renders (invisible to user)
 *   3. Overlay fades out                                     (1→0, 300ms)
 *
 * Result: smooth blur in → content swap hidden → blur out. No flash.
 * Uses CSS transitions only — zero JS animation frames, fully GPU composited.
 */

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [phase, setPhase] = useState<"idle" | "blur-in" | "blur-out">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    // Skip initial mount
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    cleanup();

    // Phase 1: blur-in (overlay appears covering old content glimpse)
    setPhase("blur-in");

    // Phase 2: after blur-in completes, switch to blur-out (new content is now rendered underneath)
    timerRef.current = setTimeout(() => {
      setPhase("blur-out");

      // Phase 3: after blur-out, go idle
      timerRef.current = setTimeout(() => {
        setPhase("idle");
      }, 300);
    }, 200);

    return cleanup;
  }, [pathname, cleanup]);

  return (
    <div className="min-h-screen min-h-dvh w-full relative">
      {children}

      {/* Blur overlay — covers the page during transition */}
      {phase !== "idle" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9998,
            backgroundColor:
              phase === "blur-in"
                ? "rgba(15, 23, 42, 0.45)"
                : "rgba(15, 23, 42, 0)",
            backdropFilter:
              phase === "blur-in" ? "blur(8px)" : "blur(0px)",
            WebkitBackdropFilter:
              phase === "blur-in" ? "blur(8px)" : "blur(0px)",
            transition:
              phase === "blur-in"
                ? "background-color 0.2s ease-out, backdrop-filter 0.2s ease-out, -webkit-backdrop-filter 0.2s ease-out"
                : "background-color 0.3s ease-in, backdrop-filter 0.3s ease-in, -webkit-backdrop-filter 0.3s ease-in",
            willChange: "backdrop-filter, background-color",
          }}
        />
      )}
    </div>
  );
}
