"use client";

import { motion } from "motion/react";

/**
 * Route transition.
 *
 * `template.tsx` remounts on every navigation (unlike `layout.tsx`), which is
 * exactly what a page transition needs.
 *
 * Kept deliberately below the threshold where a transition reads as a wait.
 * This runs on 100% of navigations, so its duration is a tax paid on every
 * single click - and the previous 450ms rise-and-fade was the single largest
 * contributor to the site feeling sluggish between pages. At 140ms the swap
 * still resolves rather than snapping, but there is no interval where the
 * visitor is looking at a page they have already asked to leave.
 *
 * Opacity only, no `y`. Beyond costing another 300ms of travel, a transform on
 * this wrapper makes it a containing block for `position: fixed` descendants -
 * so anything fixed inside a page would silently measure against this div
 * rather than the viewport for as long as the animation ran.
 *
 * No exit animation on purpose - blocking a navigation to play one out makes
 * the whole site feel slower than it is.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.14, ease: "linear" }}
    >
      {children}
    </motion.div>
  );
}
