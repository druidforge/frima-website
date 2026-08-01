import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * `animated` opts into the hover choreography, which is driven entirely by the
 * parent's `group` class - no client JS, so the logo stays a server component.
 * The mark tilts and the wordmark opens its tracking, as if the animal shifted.
 */
export function Logo({
  className,
  size = 30,
  withWordmark = true,
  animated = false,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* rotate and scale are transforms, so the mark can move without ever
          taking part in layout. */}
      <Image
        src="/octopus_silhouette_gradient.svg"
        alt=""
        width={size}
        height={size}
        priority
        unoptimized
        className={cn(
          "shrink-0",
          animated &&
            "transition-[transform,rotate] duration-(--dur-slow) ease-spring group-hover:-rotate-6 group-hover:[transform:scale(1.1)]",
        )}
      />
      {withWordmark ? <Wordmark animated={animated} /> : null}
    </span>
  );
}

const BASE = "font-display text-[1.05rem] font-bold uppercase leading-none";

function Wordmark({ animated }: { animated: boolean }) {
  if (!animated) {
    return <span className={cn(BASE, "tracking-[0.2em]")}>Oktopod</span>;
  }

  /**
   * Unlike transforms, `letter-spacing` changes the element's real width. The
   * header is a `justify-between` row, so letting the wordmark grow on hover
   * shoved the whole nav to the right.
   *
   * Both copies share one grid cell, so the box is always sized by the widest -
   * the invisible sizer, permanently at the open tracking. The visible copy
   * animates inside a box that never changes size, and nothing downstream
   * reflows.
   *
   * The two tracking values must stay in step: the sizer has to match whatever
   * the hover state opens to. They are written literally rather than shared via
   * a constant because Tailwind only generates classes it can find as complete
   * strings in the source - a template literal would silently produce no CSS.
   */
  return (
    <span className={cn(BASE, "grid")}>
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 tracking-[0.26em]"
      >
        Oktopod
      </span>
      <span className="col-start-1 row-start-1 tracking-[0.2em] transition-[letter-spacing] duration-(--dur-slow) ease-out-quint group-hover:tracking-[0.26em]">
        Oktopod
      </span>
    </span>
  );
}
