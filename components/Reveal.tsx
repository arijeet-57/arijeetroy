"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * A tiny scroll-reveal wrapper used across the lower sections. Content starts
 * shifted down + clipped and settles into place the first time it scrolls into
 * view — cinematic, one-shot (never re-hides), and cheap. `delay` lets callers
 * stagger a group by hand.
 */
const base: Variants = {
  hidden: { opacity: 0, y: 42, filter: "blur(6px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={base}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
