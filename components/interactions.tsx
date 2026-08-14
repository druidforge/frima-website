"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
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

/**
 * `Stagger`/`StaggerItem` above reveal on a clock once the group crosses
 * into view - the whole sequence plays out over a fixed ~0.6s regardless of
 * how fast the user scrolled past it, which reads as "all at once" to
 * anyone who scrolled normally rather than pausing right on the trigger.
 * `ScrollStagger`/`ScrollStaggerItem` reveal on scroll position instead:
 * each item's opacity/y is a `useTransform` of the group's own
 * `scrollYProgress`, so the reveal is scrubbed by the scroll itself - slow
 * scroll plays it slowly, fast scroll plays it fast, no scroll leaves it
 * mid-reveal exactly where the user stopped.
 *
 * The shared progress value has to live in context rather than be
 * recomputed per item: `useScroll` needs one `target` ref for the whole
 * tracked range, and every item just claims a slice of that one range
 * rather than tracking the viewport itself.
 */
const ScrollStaggerContext = createContext<MotionValue<number> | null>(null);

export function ScrollStagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof CONTAINERS;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Progress runs from 0, when the group's top edge is still 80% down the
  // viewport (just entering from below), to 1, once it has travelled up to
  // 20% down - the natural scroll distance of a section arriving and
  // settling into the upper part of the screen, rather than its entire time
  // onscreen (the default "start end"/"end start" pairing), which would
  // still be mid-reveal long after the section is centred and being read.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "start 20%"],
  });
  // Smoothed, not raw: without this each item's transform jitters with
  // every scroll-wheel tick. Same spring `ScrollProgress` above uses on the
  // read-progress bar, for the same reason.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });
  const MotionTag = CONTAINERS[as];

  return (
    <ScrollStaggerContext.Provider value={smoothProgress}>
      <MotionTag ref={ref as never} className={className}>
        {children}
      </MotionTag>
    </ScrollStaggerContext.Provider>
  );
}

export function ScrollStaggerItem({
  children,
  className,
  index,
  total,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  index: number;
  total: number;
  y?: number;
  as?: keyof typeof ITEMS;
}) {
  const progress = useContext(ScrollStaggerContext);
  if (!progress) {
    throw new Error("ScrollStaggerItem must be rendered inside ScrollStagger");
  }

  // The tracked range splits into `total` equal slices, each item claiming
  // one - so column 2 doesn't start revealing until column 1's slice of the
  // *scroll distance* has passed, not after a fixed delay.
  const span = 1 / total;
  const start = index * span;
  const end = start + span;

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const yOffset = useTransform(progress, [start, end], [y, 0]);
  const MotionTag = ITEMS[as];

  return (
    <MotionTag className={className} style={{ opacity, y: yOffset }}>
      {children}
    </MotionTag>
  );
}
