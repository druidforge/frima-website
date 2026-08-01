"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type UseInViewOptions,
} from "motion/react";

/** Shared reveal vocabulary used across the site. */

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref, "-12% 0px -8% 0px");

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Headline reveal, word by word. Words are the unit rather than characters:
 * per-character reveals shred screen-reader output and read as decoration.
 * The whole string stays in one accessible node and the spans are aria-hidden.
 */
export function RevealWords({
  text,
  className,
  delay = 0,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const shown = useRevealed(ref);
  const words = text.split(" ");

  /**
   * Each word sits in its own clipping mask, and that mask has to be bigger
   * than the text box on both axes.
   *
   * Vertically: these headings run at a line-height below 1 (the hero is 0.88),
   * so the line box is shorter than the glyphs and the mask sliced the tops off
   * ascenders and the tails off descenders - f, k, y, j.
   *
   * Horizontally: they also carry negative letter-spacing (-0.045em), which is
   * applied after every character including the last. That pulls the inline
   * box's right edge inward, past where the final glyph actually paints, so the
   * mask cropped its right side - clearest on round letters like g and o.
   *
   * `overflow` cannot be hidden on one axis and visible on the other (the spec
   * promotes the visible one to `auto`), so the fix is the same both ways: pad
   * the clipping box out beyond the glyph bounds, then remove that padding from
   * layout with an equal negative margin. Spacing, baselines and word gaps are
   * all unchanged.
   */
  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden align-bottom px-[0.12em] py-[0.22em] -mx-[0.12em] -my-[0.22em]"
          >
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={shown ? { y: "0%" } : undefined}
              transition={{
                duration: 0.85,
                delay: delay + i * 0.055,
                ease: EASE,
              }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

/**
 * "Has this entered the viewport yet", with a hard fallback.
 *
 * Reveal animations park content in a hidden resting state, so if the observer
 * never reports back, that content stays invisible for good. For body copy that
 * is bad; for a headline it is the worst failure this component can have. The
 * timer guarantees the resting state is always escaped, whatever happens to the
 * observer.
 */
function useRevealed(
  ref: React.RefObject<Element | null>,
  margin: UseInViewOptions["margin"] = "-10% 0px",
) {
  const inView = useInView(ref, { once: true, margin });
  const [failsafe, setFailsafe] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFailsafe(true), 1500);
    return () => clearTimeout(id);
  }, []);

  return inView || failsafe;
}

/** Vertical parallax tied to the element's own progress through the viewport. */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Counts up to `value` the first time it enters the viewport. */
export function CountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRevealed(ref, "-20% 0px");

  return (
    <span ref={ref} className={className}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={shown ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3 }}
      >
        {shown ? <Ticker to={value} /> : 0}
        {suffix}
      </motion.span>
    </span>
  );
}

function Ticker({ to }: { to: number }) {
  const progress = useSpring(0, { stiffness: 60, damping: 20 });
  const rounded = useTransform(progress, (v) => Math.round(v));
  progress.set(to);
  return <motion.span>{rounded as unknown as MotionValue<number>}</motion.span>;
}
