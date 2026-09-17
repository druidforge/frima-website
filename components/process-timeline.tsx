"use client";

import { useRef } from "react";
import { useInView } from "motion/react";

import { cn } from "@/lib/utils";

export type ProcessStep = { title: string; body: string };

/** Seconds between one step lighting up and the next. */
const STEP = 0.45;
/** How long each connecting segment takes to fill. */
const FILL = 0.4;

/**
 * The steps of a service as one connected line rather than a row of boxes.
 *
 * Each step owns the segment that leads out of it to the next, instead of one
 * track drawn behind the whole list. That is what lets the line fill in
 * sequence - node, segment, next node - without measuring anything, and it
 * works for both orientations: across on desktop, down the left edge on a
 * phone, where the steps' heights differ and a single precomputed track could
 * not know where the last node sits.
 *
 * Plays once, when the list first comes into view (`once: true`, the same gate
 * as every other reveal on the site). Everything is a CSS transition keyed on
 * `active` with a per-step delay, so there is no animation loop to run.
 *
 * Only the line and the nodes animate. The step text is visible from the first
 * paint, for readers and for crawlers alike.
 */
export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const active = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <ol
      ref={ref}
      className="mt-10 grid gap-y-10 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0"
    >
      {steps.map((step, index) => {
        const nodeDelay = `${index * STEP}s`;
        const fillDelay = `${index * STEP + 0.12}s`;
        const isLast = index === steps.length - 1;
        // Each segment carries only its slice of one cyan-to-violet ramp, so
        // the line reads as a single gradient instead of restarting at every
        // node.
        const span = Math.max(steps.length - 1, 1);
        const stop = (i: number) =>
          `color-mix(in oklab, var(--color-violet) ${Math.round((i / span) * 100)}%, var(--color-cyan))`;

        return (
          <li key={step.title} className="relative pl-14 lg:pl-0">
            {!isLast ? (
              /* The segment to the next node. Its length reaches past the gap
                 between items (`gap-y-10` down, `gap-x-8` across) so it meets
                 the next node exactly. */
              <span
                aria-hidden="true"
                className="absolute top-9 left-[1.125rem] h-[calc(100%-2.25rem+2.5rem)] w-px overflow-hidden bg-border lg:top-[1.125rem] lg:left-9 lg:h-px lg:w-[calc(100%-2.25rem+2rem)]"
              >
                <span
                  className={cn(
                    "absolute inset-0 origin-top bg-linear-to-b from-(--seg-from) to-(--seg-to) transition-transform ease-out-quint lg:origin-left lg:bg-linear-to-r",
                    active ? "scale-100" : "scale-y-0 lg:scale-x-0 lg:scale-y-100",
                  )}
                  style={
                    {
                      transitionDuration: `${FILL}s`,
                      transitionDelay: fillDelay,
                      "--seg-from": stop(index),
                      "--seg-to": stop(index + 1),
                    } as React.CSSProperties
                  }
                />
              </span>
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "absolute top-0 left-0 flex size-9 items-center justify-center rounded-full border bg-background font-mono text-xs transition-[color,border-color,box-shadow] duration-500 ease-out-quint lg:static",
                active
                  ? "border-violet text-violet shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-violet)_14%,transparent)]"
                  : "border-border text-ink-faint",
              )}
              style={{ transitionDelay: nodeDelay }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Deliberately not animated. Googlebot does not scroll, so text
                that waits at opacity 0 for an in-view trigger is text it may
                never see rendered. The line and the nodes carry the motion. */}
            <div className="lg:mt-6">
              <h3 className="pt-1.5 font-display text-(length:--text-step-1) font-semibold tracking-tight lg:pt-0">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
