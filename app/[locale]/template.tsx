"use client";

import { motion } from "motion/react";

/**
 * Route transition.
 *
 * `template.tsx` remounts on every navigation (unlike `layout.tsx`), which is
 * exactly what a page transition needs. Kept to a short rise and fade: an
 * elaborate transition is a delay the visitor pays on every single click.
 *
 * No exit animation on purpose - blocking a navigation to play one out makes
 * the whole site feel slower than it is.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
