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
 * Looping snap carousel, shared by the services showcase and the "other
 * services" list.
 *
 * The looping works by rendering three copies of the list - `[clones][real]
 * [clones]` - and starting in the middle, so there is a full set of room to
 * travel either way. When the scroll drifts within half a set of an edge, the
 * position jumps by exactly one set width. The seam is never visible because
 * the wrap fires long before an edge could be reached.
 *
 * `scroll-behavior` is not an inherited property, so this track scrolls
 * instantly even though the document scrolls smoothly - which is precisely what
 * a silent reposition needs.
 *
 * Callers own the markup; this owns the scroll maths.
 */
export function useLoopCarousel(count: number) {
  const trackRef = useRef<HTMLUListElement>(null);
  const isCompact = useIsCompact();
  const [active, setActive] = useState(0);

  const loop = isCompact && count > 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;

    const setWidth = () => el.scrollWidth / 3;
    el.scrollLeft = setWidth();

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const width = setWidth();
        if (width <= 0) return;

        if (el.scrollLeft < width * 0.5) el.scrollLeft += width;
        else if (el.scrollLeft > width * 1.5) el.scrollLeft -= width;

        const card = width / count;
        const index = Math.round((el.scrollLeft - width) / card);
        setActive(((index % count) + count) % count);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [loop, count]);

  const goTo = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;
      const width = loop ? el.scrollWidth / 3 : el.scrollWidth;
      const card = width / count;
      el.scrollTo({
        left: (loop ? width : 0) + card * index,
        behavior: "smooth",
      });
    },
    [loop, count],
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
