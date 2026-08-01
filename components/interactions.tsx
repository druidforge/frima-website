"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Thin gradient bar across the top of the header showing read progress.
 *
 * Driven by `scaleX` on a composited transform, so it costs nothing per frame -
 * this is the one always-on animation on the page and it must stay free.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 34,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: smooth }}
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-linear-to-r from-cyan to-violet"
    />
  );
}

/**
 * Pulls its child a short way toward the cursor, then releases on exit.
 *
 * Reserved for the single primary call to action per page. Applied broadly it
 * turns a page into a minefield of things that dodge the pointer.
 */
export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });

  return (
    <motion.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x, y }}
      onPointerMove={(event) => {
        // Coarse pointers have no hover, and a "magnetic" tap target that
        // drifts under the thumb is actively worse than a static one.
        if (event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* Motion components must be created once at module scope. Building them inside
   a render (via `motion.create`) yields a brand new component type every pass,
   which remounts the subtree and throws away its animation state. */
const CONTAINERS = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  dl: motion.dl,
} as const;

const ITEMS = {
  div: motion.div,
  li: motion.li,
} as const;

/**
 * Staggered list reveal. Children animate in sequence once the list enters the
 * viewport, so a grid resolves as a wave rather than all at once.
 */
export function Stagger({
  children,
  className,
  step = 0.06,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  as?: keyof typeof CONTAINERS;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -6% 0px" });
  const MotionTag = CONTAINERS[as];

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial="hidden"
      animate={inView ? "shown" : "hidden"}
      variants={{
        hidden: {},
        shown: {
          transition: { staggerChildren: step, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  y = 16,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: keyof typeof ITEMS;
}) {
  const MotionTag = ITEMS[as];

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: EASE },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
