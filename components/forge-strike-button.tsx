"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The forge's own step control: a bare anvil, no button chrome around it.
 * The glyph already has a horn - it tapers to a point on the right by
 * default - so `direction` mirrors the whole icon for "next" rather than
 * drawing a second glyph: the horn ends up pointing toward the other button
 * (right for prev, left for next), reading as a pair facing each other
 * across the swap rather than two arrows pointing off the edges.
 *
 * That mirror has to use a percentage `transformOrigin` ("50% 50%"), not a
 * pixel one keyed to the viewBox ("7.5px 7.5px" looked right at one size
 * and wrong at another): CSS transforms on an SVG element resolve pixel
 * origins against its rendered box, not its internal viewBox units, so a
 * viewBox-shaped origin only happens to line up with the visual centre at
 * whatever size it was eyeballed at.
 *
 * There is no hammer glyph anywhere in the DOM. Hovering swaps the system
 * cursor for one instead (plain CSS `cursor`, reverting to the default
 * arrow the instant the pointer leaves - no state needed for that part),
 * and clicking swaps that same cursor to a struck pose for a beat before it
 * springs back to raised - the "hit" plays on the pointer itself rather
 * than a graphic drawn on the page. The anvil gets its own quick
 * squash-and-recover in sync, so the two read as one impact.
 */
const HAMMER_PATHS =
  '<path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" stroke="#fff" stroke-width="4"/><path d="m18 15 4-4" stroke="#fff" stroke-width="4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" stroke="#fff" stroke-width="4"/><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" stroke="#161320" stroke-width="1.8"/><path d="m18 15 4-4" stroke="#161320" stroke-width="1.8"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" stroke="#161320" stroke-width="1.8"/>';

// Two poses of the same cursor glyph, sharing one white-halo-behind-dark-line
// treatment so it reads on any background. "raised" - the glyph's own drawn
// angle, unrotated - is the idle hover cursor and where every strike both
// starts and ends up, so the hammer always reads as up between clicks;
// "struck" drops it down for the moment right after a click, then it springs
// back to raised - a two-frame swap timed by `STRIKE_CURSOR_MS`, not a
// continuous tween (CSS cursors can't keyframe).
//
// The rotation pivots on the grip - the handle's own rounded end at (4,20),
// not the icon's geometric centre - so the head (the far end of the tool)
// is what visibly swings. Pivoting at the centre instead span both the head
// and a good length of handle through the same arc, and the handle's longer
// reach off-centre made it read as the part doing the spinning, backwards
// from an actual swing. That grip point also doubles as the cursor hotspot
// for both poses, so the hotspot doesn't visibly jump when the pose swaps.
//
// The sign matters: a negative rotation here swings the head *further up*
// (more vertical, away from the anvil) rather than down onto it - checked by
// rendering both signs side by side, not guessed. Positive is what drops it.
const GRIP = "4 20";
function hammerCursor(rotateDeg: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(${rotateDeg} ${GRIP})">${HAMMER_PATHS}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${GRIP}, pointer`;
}

const HAMMER_CURSOR_RAISED = hammerCursor(0);
const HAMMER_CURSOR_STRUCK = hammerCursor(30);
const STRIKE_CURSOR_MS = 150;

export function ForgeStrikeButton({
  onClick,
  label,
  direction,
  className,
}: {
  onClick: () => void;
  label: string;
  direction: "prev" | "next";
  className?: string;
}) {
  const [strike, setStrike] = useState(0);
  const [struck, setStruck] = useState(false);
  const revertTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(revertTimer.current), []);

  return (
    <button
      type="button"
      onClick={() => {
        setStrike((n) => n + 1);
        onClick();

        setStruck(true);
        clearTimeout(revertTimer.current);
        revertTimer.current = setTimeout(
          () => setStruck(false),
          STRIKE_CURSOR_MS,
        );
      }}
      aria-label={label}
      style={{ cursor: struck ? HAMMER_CURSOR_STRUCK : HAMMER_CURSOR_RAISED }}
      className={cn(
        "flex h-11 w-11 items-center justify-center text-ink/70 transition-[color,transform] duration-(--dur-base) hover:text-ink active:scale-90",
        className,
      )}
    >
      <svg
        viewBox="0 0 15 15"
        className="h-8 w-8"
        fill="currentColor"
        style={
          direction === "next"
            ? { transform: "scaleX(-1)", transformOrigin: "50% 50%" }
            : undefined
        }
        aria-hidden="true"
      >
        <motion.g
          key={strike}
          style={{ transformOrigin: "50% 73%" }}
          initial={{ scale: 1, y: 0 }}
          animate={{ scale: [1, 0.88, 1.06, 1], y: [0, 1.6, -0.8, 0] }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <path d="m11 9.5l2 1.5v1h-2c-.67-.67-1.5-1-2.5-1s-1.83.33-2.5 1H4v-1l2-1.5zM15 4v1c-2.14 0-3.89 1.68-4 3.8V9H6c0-.64-.25-1.25-.71-1.71L5 7V4zM0 4.5h4.5V7C2.83 7 1.33 6.17 0 4.5" />
        </motion.g>
      </svg>
    </button>
  );
}
