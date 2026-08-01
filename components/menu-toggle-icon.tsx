import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type MenuToggleProps = ComponentProps<"svg"> & {
  open: boolean;
};

/**
 * Menu / close button icon, ported from the Central Beach Split site.
 *
 * One continuous path does both states. Collapsed, `stroke-dasharray: 12 63`
 * shows only a short dash - the top bar of the burger. Open, the dash grows to
 * 20 and is pushed along the path by `stroke-dashoffset`, so the visible run
 * slides around the curve into the second stroke of an X while the whole icon
 * rotates -45deg. The straight middle line stays put and becomes the other
 * stroke.
 *
 * Two reasons it is worth the odd-looking numbers: it is one element rather
 * than three animated bars, and stroke-dash values interpolate natively - no
 * library, and none of the composed-custom-property problems that stop
 * Tailwind's `scale`/`filter` utilities transitioning.
 *
 * Timing comes from the shared motion tokens rather than the original's inline
 * duration, so it moves with the rest of the site.
 */
export function MenuToggleIcon({
  open,
  className,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2.5,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  ...props
}: MenuToggleProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={cn(
        "transition-[transform,rotate] duration-(--dur-slow) ease-out-quint",
        open && "-rotate-45",
        className,
      )}
      {...props}
    >
      <path
        className={cn(
          "transition-all duration-(--dur-slow) ease-out-quint",
          open
            ? "[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]"
            : "[stroke-dasharray:12_63]",
        )}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}
