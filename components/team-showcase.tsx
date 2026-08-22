"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

import { ForgeStrikeButton } from "@/components/forge-strike-button";
import { cn, mulberry32 } from "@/lib/utils";

type Person = {
  name: string;
  role: string;
  bio: string;
  photo: string;
};

/**
 * One photo active at a time, in a tilted stack, with a hammer-and-anvil
 * strike to step through the rest - the "meet the two of us" section as a
 * small, self-contained switcher rather than the full-width scroll rows the
 * site used to run here.
 *
 * The whole thing is one layout: there is no separate mobile version to keep
 * in sync, because there is nothing here a touch screen cannot do - the
 * state is a click (or a tap), not a hover, and `md:grid-cols-2` is the only
 * thing that changes shape below that breakpoint, stacking photo above text
 * instead of beside it.
 *
 * Each card's tilt has to read as a fan, not a flinch: a magnitude near
 * zero, or two cards leaning the same way, just looks like a flat stack with
 * a rounded corner poking out. `tiltFor` fixes that by alternating the sign
 * per index (even cards lean left, odd lean right) and only randomising the
 * magnitude within a range that stays visible (6-11deg), seeded by index via
 * `mulberry32` rather than `Math.random()` so the angle SSR renders with is
 * the one hydration lands on too, instead of a one-frame snap.
 */
export function TeamShowcase({
  people,
  prevLabel,
  nextLabel,
  autoplay = false,
  className,
}: {
  people: Person[];
  prevLabel: string;
  nextLabel: string;
  autoplay?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  const handleNext = () => setActive((prev) => (prev + 1) % people.length);
  const handlePrev = () =>
    setActive((prev) => (prev - 1 + people.length) % people.length);
  const isActive = (index: number) => index === active;

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  const tiltFor = (index: number) => {
    const rand = mulberry32(index + 1);
    const magnitude = 6 + Math.floor(rand() * 6);
    return index % 2 === 0 ? -magnitude : magnitude;
  };

  return (
    <div className={cn("mx-auto max-w-4xl", className)}>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        {/* `isolate` traps the active photo's zIndex:999 in its own stacking
            context - without it that 999 out-ranks the site header's fixed
            z-50 (nothing between them creates a context otherwise), and the
            photo floats above the nav bar mid-swap. */}
        {/* Portrait box, matching the 4:5 the photos are mastered at, so the
            frame crops nothing rather than taking a landscape slice off the
            top of a standing shot. `mx-auto max-w-xs` keeps it from growing
            unwieldy on a wide viewport once the ratio drives the height. */}
        <div className="relative isolate mx-auto aspect-4/5 w-full max-w-xs">
          <AnimatePresence>
            {people.map((person, index) => (
              <motion.div
                key={person.photo}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  rotate: tiltFor(index),
                }}
                animate={{
                  opacity: isActive(index) ? 1 : 0.7,
                  scale: isActive(index) ? 1 : 0.95,
                  rotate: isActive(index) ? 0 : tiltFor(index),
                  zIndex: isActive(index) ? 999 : people.length + 2 - index,
                  y: isActive(index) ? [0, -60, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, rotate: tiltFor(index) }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 origin-bottom"
              >
                <Image
                  src={person.photo}
                  alt={person.name}
                  fill
                  sizes="(max-width: 767px) 90vw, 20rem"
                  draggable={false}
                  className="rounded-3xl object-cover object-top"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-between py-2">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <h3 className="font-display text-(length:--text-step-2) font-semibold">
              {people[active].name}
            </h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              {people[active].role}
            </p>
            <motion.p className="mt-7 text-ink-soft">
              {people[active].bio.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          <div className="flex gap-2 pt-10 md:pt-0">
            <ForgeStrikeButton
              onClick={handlePrev}
              label={prevLabel}
              direction="prev"
            />
            <ForgeStrikeButton
              onClick={handleNext}
              label={nextLabel}
              direction="next"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
