"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const COMPACT = "(max-width: 767px)";

/**
 * Hydration-safe "is this a phone-width viewport".
 *
 * Returns `false` on the server and for the hydration render, so markup always
 * matches; the real value arrives immediately afterwards. That is what lets the
 * carousel clones exist on mobile only - never server-rendered, never on
 * desktop.
 */
export function useIsCompact() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(COMPACT);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(COMPACT).matches,
    () => false,
  );
}

/**
 * How long the track has to sit still before a fling counts as over.
 *
 * Only a fallback: `scrollend` handles it exactly where the browser supports
 * it. Long enough to outlast the gap between two momentum frames on a slow
 * phone, short enough that a deliberate swipe-and-hold does not feel stuck.
 */
const SETTLE_MS = 140;

/**
 * Looping snap carousel, shared by the services showcase and the "other
 * services" list.
 *
 * The looping works by rendering three copies of the list - `[clones][real]
 * [clones]` - and parking on the middle one, so there is a full set of room to
 * travel either way. Once the scroll settles, the position hops by the distance
 * between two copies of the card you landed on. The seam is never visible
 * because the card under your thumb does not move: only the coordinates change.
 *
 * Three things that a hard swipe used to break, and why they are done this way:
 *
 * 1. **The hop waits for the scroll to stop.** Writing `scrollLeft` in the
 *    middle of a fling puts the main thread in a fight with a compositor
 *    animation that still believes in its original target - it either yanks the
 *    track back across a whole set or re-snaps somewhere arbitrary. So the wrap
 *    hangs off `scrollend`, with a settle timer for browsers without it.
 * 2. **Distances are measured, never derived from `scrollWidth`.** `gap` sits
 *    *between* flex items, so three sets of six cards measure
 *    `3 * stride - gap`, and `scrollWidth / 3` came out a third of a gap short.
 *    Every wrap inherited that error, mandatory snap corrected for it with a
 *    visible hop, and the drift compounded. Reading the cards' own boxes gives
 *    the exact figures - and the centres are what the dots want anyway.
 * 3. **Snap is silenced for the duration of the hop.** A programmatic scroll on
 *    a mandatory-snap container gets re-snapped afterwards; Safari has been
 *    known to pick a different snap point than the one you asked for.
 *
 * `scroll-behavior` is not inherited and the document does not declare it
 * smooth, so these writes land instantly - which is precisely what a silent
 * reposition needs. Callers own the markup; this owns the scroll maths.
 *
 * Cards must carry `snap-always` (`scroll-snap-stop: always`). It caps a fling
 * at one card, which is both the expected feel and the reason the clone buffer
 * cannot be outrun.
 */
export function useLoopCarousel(count: number) {
  const trackRef = useRef<HTMLUListElement>(null);
  const isCompact = useIsCompact();
  const [active, setActive] = useState(0);

  const loop = isCompact && count > 1;

  /** Card centres in the track's own scroll coordinates, refreshed on resize. */
  const centersRef = useRef<number[]>([]);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return centersRef.current;

    // Scroll offsets, not viewport ones: the origin has to survive scrolling.
    const origin = el.getBoundingClientRect().left - el.scrollLeft;
    centersRef.current = Array.from(el.children, (child) => {
      const box = child.getBoundingClientRect();
      return box.left - origin + box.width / 2;
    });

    return centersRef.current;
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;

    /** Index into the tripled list of the card sitting closest to centre. */
    const nearest = () => {
      const centers = centersRef.current;
      const middle = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestGap = Infinity;
      for (let i = 0; i < centers.length; i += 1) {
        const gap = Math.abs(centers[i] - middle);
        if (gap < bestGap) {
          bestGap = gap;
          best = i;
        }
      }
      return best;
    };

    const jump = (left: number) => {
      el.style.scrollSnapType = "none";
      el.scrollLeft = left;
      void el.offsetWidth; // flush, so re-enabling snap sees the new position
      el.style.scrollSnapType = "";
    };

    /**
     * Move to the middle set's copy of whatever card is on screen.
     *
     * Shifting by the gap between the two copies rather than scrolling to an
     * absolute position keeps any sub-snap offset intact, so a wrap mid-drag
     * would still not show. Landing on the middle copy - rather than merely
     * inside the middle set - leaves a full `count` of cards spare in both
     * directions, which is what makes the buffer impossible to swipe through.
     */
    const park = (index: number) => {
      const centers = centersRef.current;
      const from = centers[index];
      const to = centers[count + (index % count)];
      if (from === undefined || to === undefined || to === from) return;
      jump(el.scrollLeft + (to - from));
    };

    const settled = () => {
      const index = nearest();
      setActive(index % count);
      park(index);
    };

    measure();
    park(nearest());

    let frame = 0;
    let settle = 0;

    const onScroll = () => {
      // The dots follow the swipe live; the wrap does not.
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          setActive(nearest() % count);
        });
      }
      window.clearTimeout(settle);
      settle = window.setTimeout(settled, SETTLE_MS);
    };

    const onScrollEnd = () => {
      window.clearTimeout(settle);
      settled();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);

    // Rotation changes every card's width, which invalidates all of the above.
    // Fires once on observe too, covering the case where the first measurement
    // ran before the track had its final width.
    const resize = new ResizeObserver(() => {
      measure();
      park(nearest());
    });
    resize.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      resize.disconnect();
      window.clearTimeout(settle);
      if (frame) cancelAnimationFrame(frame);
      el.style.scrollSnapType = "";
    };
  }, [loop, count, measure]);

  const goTo = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;

      const centers = measure();
      const middle = el.scrollLeft + el.clientWidth / 2;

      /**
       * Aim at the nearest copy of that card, not the one in the middle set.
       * From the last card, the first dot is one card to the right; travelling
       * back across five of them to reach the "real" copy would be a long
       * animation for a short move - and a long animation is time the wrap has
       * to sit and wait through.
       */
      let target = -1;
      let bestGap = Infinity;
      for (let i = index; i < centers.length; i += count) {
        const gap = Math.abs(centers[i] - middle);
        if (gap < bestGap) {
          bestGap = gap;
          target = i;
        }
      }
      if (target < 0) return;

      setActive(index);
      el.scrollTo({
        left: centers[target] - el.clientWidth / 2,
        behavior: "smooth",
      });
    },
    [count, measure],
  );

  /** Repeats the list three times on mobile so the loop has room to wrap. */
  const expand = useCallback(
    <T,>(items: T[]): T[] => (loop ? [...items, ...items, ...items] : items),
    [loop],
  );

  /** True for the duplicated copies, which must stay out of a11y and tab order. */
  const isClone = useCallback(
    (index: number) => loop && (index < count || index >= count * 2),
    [loop, count],
  );

  return { trackRef, active, setActive, isCompact, loop, goTo, expand, isClone };
}
