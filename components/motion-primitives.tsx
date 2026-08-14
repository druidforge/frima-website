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
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** Skip the viewport gate. See `useRevealed`. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref, "-12% 0px -8% 0px", immediate);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Enters from off to one side, tied directly to scroll offset rather than
 * triggered once by a visibility check like `Reveal`.
 *
 * The first version of this used `useInView` + a timed failsafe - the same
 * shape as every other reveal in this file. Wrong shape for this job: that
 * failsafe exists so a heading near the fold never waits long on an observer,
 * and it does its job by settling content whether or not it has actually
 * been seen yet. Fine for a 22px rise; fatal for a wide entrance meant to
 * play out as the visitor scrolls, since it settled the panel into place
 * before they had scrolled anywhere near it - by the time the row was
 * actually in view there was nothing left to animate.
 *
 * `useScroll` + `useTransform` sidesteps the whole question of "has it been
 * triggered yet" by not having a trigger at all. Position is a continuous
 * function of `scrollYProgress`, the same mechanism `Parallax` above uses -
 * the only difference is the `offset` window is narrow and one-directional
 * rather than spanning the element's full transit, so it reads as arriving
 * and settling rather than drifting the whole time it is on screen.
 * `useTransform` clamps outside [0, 1] by default, which is what makes it
 * stay put once scrolled past rather than overshooting.
 *
 * `delay` shifts that window later in scroll terms (smaller offset
 * percentages = more scroll required to reach them) rather than deferring a
 * timer, so a photo and its caption can still stagger without either of them
 * waiting on a `setTimeout`.
 */
export function SlideIn({
  children,
  from = "left",
  distance = 90,
  delay = 0,
  className,
}: {
  children: ReactNode;
  from?: "left" | "right";
  distance?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Each pair is [targetProgress, containerProgress]: 0 on the target's own
  // axis is its start (top) edge, so `[0, 0.92 - delay]` reads as "the row's
  // top edge, 92% down the viewport" - the numeric form of "start 0.92%",
  // without needing a template-literal string to satisfy the offset type.
  //
  // Narrower and earlier than the first pass (0.88->0.48): that version was
  // still mid-fade by the time a normal scroll brought the row anywhere near
  // a comfortable reading position, so a visitor scrolling at an ordinary
  // pace saw an unsettled panel rather than the finished one - worst on a
  // row's text half, stacked behind `delay`. Finishing by 0.6 instead of
  // 0.48 means both halves of a row are done well before it reaches the
  // middle of the viewport, so scrolling to actually look at it shows it
  // whole rather than still arriving.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [
      [0, 0.92 - delay],
      [0, 0.6 - delay],
    ],
  });

  const startX = from === "left" ? -distance : distance;
  const rawX = useTransform(scrollYProgress, [0, 1], [startX, 0]);
  const x = useSpring(rawX, { stiffness: 140, damping: 26, mass: 0.4 });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div ref={ref} className={className} style={{ x, opacity }}>
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
  immediate = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
  /** Skip the viewport gate. See `useRevealed`. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const revealed = useRevealed(ref, "-10% 0px", immediate);
  const fontsReady = useFontsReady(ref, text);
  // Both gates, because a rise that starts before the display face lands is the
  // one that visibly stutters. See `useFontsReady`.
  const shown = revealed && fontsReady;
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
   *
   * That padding is also why the travel below is not 100%.
   *
   * A percentage translate resolves against the moving element's own box - the
   * line box, which is `line-height` tall. The box doing the clipping is that
   * plus 0.22em of padding at each end. So a word parked at `110%` was pushed
   * down by 1.1 line boxes into a mask 0.44em taller than one, and at the
   * hero's `leading-[0.88]` that leaves 0.968em of travel against a 1.32em
   * opening: the tops of the glyphs sat inside the mask before the animation
   * had started, which is the sliver that was visible up front.
   *
   * The worst case is the tightest leading, since the fixed padding is largest
   * relative to it. At 0.88 the word must clear (0.88 + 0.22) / 0.88 = 125% of
   * itself; at the 0.95 the other headings inherit, 123%. 140% clears both with
   * room left over, and holds for any looser leading - a taller line box only
   * makes the fixed padding a smaller share of it.
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
              initial={{ y: "140%" }}
              animate={shown ? { y: "0%" } : undefined}
              transition={{
                duration: 0.62,
                delay: delay + i * 0.045,
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
 *
 * That fallback was 1500ms, which is a long time to show nothing when it does
 * fire. 300ms still gives a healthy observer several frames to report first,
 * and bounds the worst case to something recoverable.
 *
 * `immediate` is for content that is above the fold by construction - a page
 * header's own <h1> cannot be anywhere else. Asking an IntersectionObserver
 * whether it is on screen costs a callback round trip to be told "yes", and
 * that answer arrives after the browser has already painted the hidden state.
 * On a client navigation that shows up as a heading that flashes in late. When
 * the answer is known at author time, skip the question.
 */
function useRevealed(
  ref: React.RefObject<Element | null>,
  margin: UseInViewOptions["margin"] = "-10% 0px",
  immediate = false,
) {
  const inView = useInView(ref, { once: true, margin });
  const [failsafe, setFailsafe] = useState(false);

  useEffect(() => {
    if (immediate) return;
    const id = setTimeout(() => setFailsafe(true), 300);
    return () => clearTimeout(id);
  }, [immediate]);

  // Still animates from `initial` on mount - it just does not wait to be told
  // it is visible first.
  return immediate || inView || failsafe;
}

/**
 * "Have the webfonts settled yet", capped so it can never hold content back.
 *
 * The display face is served with `font-display: swap`, so a heading paints
 * first in the fallback and is re-laid-out when Bricolage arrives. For most
 * text that is a barely-noticed reflow. For this component it is the whole
 * problem: each word is clipped by a mask whose padding is measured in `em`,
 * and the travel is a percentage of the line box. A face landing mid-rise
 * changes every one of those measurements at once, so the words jump sideways
 * and their masks resize while they are moving - read as a flicker.
 *
 * Waiting costs nothing on the navigations this matters most for. `status` is
 * already `"loaded"` on any client-side navigation, and on a warm load, so this
 * resolves on the first effect pass; only a genuinely cold first paint waits at
 * all. The 400ms cap means a font that is slow or never arrives delays the
 * headline by at most that, rather than indefinitely.
 */
function useFontsReady(ref: React.RefObject<Element | null>, text: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fonts = document.fonts;
    const el = ref.current;
    if (!fonts || !el || fonts.status === "loaded") {
      setReady(true);
      return;
    }

    let cancelled = false;
    const settle = () => {
      if (!cancelled) setReady(true);
    };

    /**
     * Ask for this heading's own face rather than `fonts.ready`.
     *
     * The page loads three families; `fonts.ready` waits for all of them, so a
     * slow monospace nobody can see yet would hold the headline. Resolving the
     * element's computed shorthand asks only for the faces needed to set this
     * string in this heading - which is exactly what has to be stable before
     * the words can start moving.
     */
    const style = getComputedStyle(el);
    const shorthand = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const id = setTimeout(settle, 400);
    // A malformed shorthand rejects rather than resolving empty, and an
    // unstyled headline is far worse than an early one.
    fonts
      .load(shorthand, text)
      .then(settle)
      .catch(settle)
      .finally(() => clearTimeout(id));

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [ref, text]);

  return ready;
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

  // Starting the spring is a side effect, so it belongs in an effect rather
  // than the render body. Called inline it re-fired on every render of this
  // subtree, and under StrictMode's double render it started the animation
  // twice before the first frame.
  useEffect(() => {
    progress.set(to);
  }, [progress, to]);

  return <motion.span>{rounded as unknown as MotionValue<number>}</motion.span>;
}
