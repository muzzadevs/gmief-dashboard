"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Global page transition — smooth blur + fade.
 *
 * Exit:  content blurs out (0→6px) while fading (1→0) — 0.25s
 * Enter: content sharpens in (6px→0) while fading (0→1) — 0.35s
 *
 * Uses will-change and GPU-friendly filter for jank-free performance.
 * No scale, no translateY — blur + opacity only keeps layout stable.
 */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: 0.35, ease: EASE_OUT },
        }}
        exit={{
          opacity: 0,
          filter: "blur(6px)",
          transition: { duration: 0.2, ease: EASE_IN },
        }}
        style={{ willChange: "opacity, filter" }}
        className="min-h-screen min-h-dvh w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
