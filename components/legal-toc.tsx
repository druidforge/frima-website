"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Distance from the top of the viewport that counts as "where you are reading".
 *
 * Matches the `scroll-mt-28` (7rem) the sections carry, so a clicked entry
 * lands exactly on this line and immediately reads as active. A few pixels of
 * slack absorb sub-pixel rounding after a smooth scroll.
 */
const READING_LINE = 120;

/**
 * Scrollspy contents list.
 *
 * Reads scroll position directly rather than using an IntersectionObserver.
 * The observer version highlighted the wrong entry, for a reason that is easy
 * to miss: its callback receives only the sections whose intersection
 * *changed*, never the full set. Treating that batch as "everything currently
 * visible" means the answer depends on which section happened to cross the
 * boundary last - so scrolling past a heading could promote its neighbour, and
 * clicking an entry could highlight a different one.
 *
 * Comparing offsets answers the question directly instead: the active section
 * is the last one whose top has passed the reading line. That also guarantees
 * the highlight agrees with where an anchor click actually lands, because both
 * use the same offset.
 */
export function LegalToc({
  label,
  sections,
}: {
  label: string;
  sections: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id);

  // `sections` is rebuilt by the parent on every render, so depending on the
  // array itself would restart the listener each time. The id list is what
  // actually matters, and it is stable.
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.scrollY + READING_LINE;
      let current = list[0];

      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top + window.scrollY <= line) current = id;
        else break;
      }

      // The final section is often too short to reach the reading line, so it
      // would never activate without this. At the bottom of the page it is
      // unambiguously the one being read.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = list[list.length - 1];

      setActive((prev) => (prev === current ? prev : current));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Scheduled rather than called outright: a synchronous setState inside an
    // effect body cascades an extra render.
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key]);

  return (
    <nav aria-label={label} className="lg:sticky lg:top-28 lg:self-start">
      <h2 className="eyebrow">{label}</h2>
      <ol className="mt-5 space-y-0.5">
        {sections.map((section, index) => {
          const isActive = section.id === active;
          return (
            <li key={section.id} className="relative">
              <a
                href={`#${section.id}`}
                /**
                 * Smoothness used to come from `scroll-behavior: smooth` on
                 * <html>. That is the same scroller the router drives on every
                 * navigation, so it was animating every route change too. It is
                 * gone; this list scrolls itself instead.
                 *
                 * `scrollIntoView` honours `scroll-margin-top`, so the section's
                 * `scroll-mt-28` still lands it on the reading line - the same
                 * offset the scrollspy above measures against.
                 */
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  const target = document.getElementById(section.id);
                  if (!target) return;
                  event.preventDefault();
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                  // Keeps the hash shareable and the entry in history, exactly
                  // as the plain anchor did.
                  history.pushState(null, "", `#${section.id}`);
                }}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex gap-3 rounded-sm py-1.5 pl-3 text-sm transition-colors duration-(--dur-base)",
                  isActive ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="toc-active"
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-cyan to-violet"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                ) : null}
                <span className="font-mono text-xs text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
