"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
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
                {/* One glyph for both states - 45 degrees turns the plus into
                    a close mark, so the control animates instead of swapping
                    icon files. */}
                <Plus
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-ink-faint transition-[transform,color] duration-(--dur-base) ease-out-quint group-hover:text-violet",
                    isOpen && "rotate-45 text-violet",
                  )}
                />
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
