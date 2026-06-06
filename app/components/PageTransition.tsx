"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useRef, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const forwardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: 40,
    filter: "blur(12px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.08,
    y: -30,
    filter: "blur(10px)",
    transition: {
      duration: 0.4,
      ease: EASE,
    },
  },
};

const backwardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 1.08,
    y: -40,
    filter: "blur(12px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 30,
    filter: "blur(10px)",
    transition: {
      duration: 0.4,
      ease: EASE,
    },
  },
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  useEffect(() => {
    const prev = prevPathRef.current;
    // Login -> Dashboard = forward, Dashboard -> Login = backward
    if (prev === "/" && pathname === "/dashboard") {
      setDirection("forward");
    } else if (prev === "/dashboard" && pathname === "/") {
      setDirection("backward");
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  // Only animate transitions between / and /dashboard
  const isTransitionPage = pathname === "/" || pathname === "/dashboard";

  if (!isTransitionPage) {
    return <>{children}</>;
  }

  const currentVariants = direction === "forward" ? forwardVariants : backwardVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={currentVariants}
        className="min-h-screen min-h-dvh w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
