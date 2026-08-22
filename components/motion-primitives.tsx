"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
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
  // A literal "\n" forces a deliberate line break instead of leaving the
  // wrap point to whatever the container's width happens to produce - the
  // hero title needs "Druid Forge" and its tagline on their own lines
  // regardless of viewport, not wherever the browser runs out of room.
  // Every other call site's copy has no "\n" in it, so `lines` is a single
  // element there and this renders exactly as it did before.
  const lines = text.split("\n");

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
  // Position within the *whole* heading, not just its own line, so the
  // stagger delay keeps counting smoothly through a "\n" break instead of
  // restarting at 0 for the second line.
  let wordIndex = 0;

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true">
        {lines.map((line, lineI) => (
          <span key={lineI} className="block">
            {line.split(" ").map((word, i, lineWords) => {
              const globalIndex = wordIndex++;
              return (
                <span key={`${word}-${i}`}>
                  <span className="inline-block overflow-hidden align-bottom px-[0.12em] py-[0.22em] -mx-[0.12em] -my-[0.22em]">
                    {/**
                     * `immediate` headings are above the fold by construction,
                     * which makes them Largest Contentful Paint candidates - so
                     * they animate in CSS, which runs at stylesheet parse
                     * instead of waiting for the Motion bundle to hydrate. The
                     * keyframes match this transition exactly (see
                     * `@keyframes word-rise` in `app/globals.css`).
                     *
                     * The tradeoff taken knowingly: this path skips the
                     * `fontsReady` gate below, so on a cold cache a word can
                     * begin rising in the fallback face and swap mid-flight.
                     * Waiting for the webfont is precisely what was delaying
                     * the paint, and a brief swap costs less than a heading
                     * that is invisible for seconds.
                     *
                     * Everything else keeps the observer-gated `motion` path:
                     * it cannot affect LCP, and JS has long since arrived.
                     */}
                    {immediate ? (
                      <span
                        className="word-rise inline-block"
                        style={{
                          animationDelay: `${delay + globalIndex * 0.045}s`,
                        }}
                      >
                        {word}
                      </span>
                    ) : (
                      <motion.span
                        className="inline-block"
                        initial={{ y: "140%" }}
                        animate={shown ? { y: "0%" } : undefined}
                        transition={{
                          duration: 0.62,
                          delay: delay + globalIndex * 0.045,
                          ease: EASE,
                        }}
                      >
                        {word}
                      </motion.span>
                    )}
                  </span>
                  {/* A trailing space *inside* the clipped, overflow-hidden
                      box above gets silently collapsed away by the browser
                      at certain box boundaries - moving it out here, as a
                      plain sibling text node the mask never touches, is what
                      actually keeps it. */}
                  {i < lineWords.length - 1 ? " " : ""}
                </span>
              );
            })}
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
