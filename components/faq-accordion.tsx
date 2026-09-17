"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export type FaqEntry = { q: string; a: string };

/**
 * The question list, one panel open at a time.
 *
 * **Every answer stays mounted.** This is the one rule the component exists to
 * keep: a closed panel animates to `height: 0` and is never unmounted, so all
 * five answers are in the served HTML whether or not anyone clicks. Swapping
 * this for `AnimatePresence` would remove the text from the DOM and hand
 * Google an empty section - on pages added specifically to give Google
 * something to read, that would undo the point of writing them. Google indexes
 * collapsed accordion content normally; it cannot index content that is not
 * there.
 *
 * Accordion rather than the open prose it replaces. Five questions with their
 * answers ran to most of a screen of text that a visitor had not asked for,
 * which is what "a lot of words saying nothing" looks like from the outside.
 * Collapsed, the same section is a scannable list of five real questions, and
 * the answer arrives when one is picked. The first opens on load so the
 * section shows what kind of answer it gives rather than reading as five inert
 * rows.
 *
 * Single-open: opening one closes the others. With answers this short, keeping
 * several open only makes the reader hunt for where they were.
 */
export function FaqAccordion({ entries }: { entries: FaqEntry[] }) {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <dl className="mt-8 border-t border-border">
      {entries.map((entry, index) => {
        const isOpen = open === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={entry.q} className="border-b border-border">
            <dt>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                // Toggles rather than always opening: a second click on the
                // open row closes it, which is what the chevron/plus implies.
                onClick={() => setOpen(isOpen ? -1 : index)}
                className="group flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
              >
                <span
                  className={cn(
                    "font-display text-(length:--text-step-1) font-semibold tracking-tight transition-colors duration-(--dur-base)",
                    isOpen ? "text-ink" : "text-ink-soft group-hover:text-ink",
                  )}
                >
                  {entry.q}
                </span>
                <DotsToCross open={isOpen} />
              </button>
            </dt>
            <motion.dd
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              // Hidden from assistive tech while collapsed, but still in the
              // DOM for crawlers. No focusable content inside, so there is no
              // tab stop to trap.
              aria-hidden={!isOpen}
              // `false` so the first panel is simply open on load rather than
              // animating itself open while the page settles.
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.34, ease: EASE }}
              className="m-0 overflow-hidden"
            >
              <p className="max-w-[72ch] pb-6 leading-relaxed text-ink-soft">
                {entry.a}
              </p>
            </motion.dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Four arms, clockwise from top-right, each pointing out from the centre.
 * `stroke` pairs the two arms that make one diagonal of the X.
 */
const ARMS = [
  { angle: -45, stroke: 0 },
  { angle: 45, stroke: 1 },
  { angle: 135, stroke: 0 },
  { angle: 225, stroke: 1 },
] as const;

/** Arm length from the centre, and the two states of its visible segment. */
const ARM = 8;
const DOT = 4;
const LINE = 2;
/** Gap between the first diagonal and the second. */
const STROKE_DELAY = 70;

/**
 * Closed: four dots at the corners of a small square. Open: an X.
 *
 * Each arm is a segment pinned to its outer end. Closed, the segment is as
 * wide as it is tall, which with `rounded-full` is a dot sitting at the tip.
 * Opening grows it inward to the centre and thins it to a line, so the dots
 * draw the X rather than turning into it - no rotation anywhere, which is what
 * keeps it from reading as a spinner.
 *
 * The diagonals go one after the other, the way you would draw an X by hand:
 * the first pair on open, the second 70ms later. Closing plays it backwards,
 * so the second stroke retracts first and the icon never lands on a shape it
 * did not pass through on the way in.
 *
 * Sizes are whole pixels on purpose - see the `marginTop` note below.
 *
 * `width` and `height` are transitioned rather than `transform: scale`.
 * Scaling a round-capped bar squashes its radius into an ellipse; changing the
 * box keeps the ends round in both states, which is the whole look. The boxes
 * are a few pixels, so the layout cost is nil.
 */
function DotsToCross({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative size-5 shrink-0 transition-colors duration-(--dur-base) ease-out-quint",
        open ? "text-violet" : "text-ink-faint group-hover:text-violet",
      )}
    >
      {ARMS.map(({ angle, stroke }) => {
        // Open draws stroke 0 then 1; close retracts stroke 1 then 0.
        const order = open ? stroke : 1 - stroke;

        return (
          <span
            key={angle}
            className="absolute top-1/2 left-1/2 h-0 origin-left"
            style={{ width: ARM, transform: `rotate(${angle}deg)` }}
          >
            <span
              className="absolute top-0 right-0 rounded-full bg-current transition-[width,height,margin-top] duration-[420ms] ease-out-quint motion-reduce:transition-none"
              style={{
                width: open ? ARM : DOT,
                height: open ? LINE : DOT,
                // Centred on the arm by a whole-pixel margin, not translate(-50%):
                // a percentage offset puts a small box on a half pixel, and under
                // the arm's 45-degree rotation that rasterises the dot as an oval.
                marginTop: -(open ? LINE : DOT) / 2,
                transitionDelay: `${order * STROKE_DELAY}ms`,
              }}
            />
          </span>
        );
      })}
    </span>
  );
}
