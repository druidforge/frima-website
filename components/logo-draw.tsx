"use client";

import { useRef } from "react";
import { useInView } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The mark, sketched in rather than switched on.
 *
 * Replaces the ambient chromatophore silhouette that used to resolve out of
 * the particle field on this section - a nice trick, but it made the studio's
 * own mark something a visitor had to notice by hovering rather than
 * something shown to them. This draws the actual logo once, the first time
 * it enters the viewport (`useInView`, `once: true` - the same gate every
 * other reveal on the site uses), then stays exactly as drawn.
 *
 * The draw is SMIL, not JS or CSS: every `<animate>` below runs on the
 * browser's own SVG timeline, independent of React's render loop, so there is
 * nothing to keep in sync and nothing that can drop a frame under load. Each
 * drawable path carries its own `pathLength="1"`, so `stroke-dasharray`/
 * `-dashoffset` are always fractions of 1 regardless of how convoluted the
 * underlying `d` is - the timings below don't have to know the geometry.
 * Every `<animate>` ends with `fill="freeze"`, so once a stroke or fill
 * reaches its target it simply holds there - no raster swap, no second
 * asset, just the vector settling into the finished mark.
 *
 * Sequence: the anvil's outline draws first, the circuit traces ink in behind
 * it staggered slightly apart, the nodes pop once their trace arrives, and
 * every fill fades in only after its own outline is complete - the classic
 * "line first, colour after" logo intro, not a wipe or a fade.
 */

const T = {
  outline: { begin: 0, dur: 1.0 },
  notchDraw: { begin: 0.15, dur: 0.45 },
  notchFill: { begin: 0.6, dur: 0.25 },
  bodyFill: { begin: 1.0, dur: 0.5 },
  lighting: { begin: 1.2, dur: 0.5 },
  uprightFill: { begin: 0.9, dur: 0.3 },
  circuitUpper: { begin: 0.35, dur: 0.85 },
  circuitUpperFill: { begin: 1.2, dur: 0.35 },
  circuitRight: { begin: 0.5, dur: 0.85 },
  circuitRightFill: { begin: 1.35, dur: 0.35 },
  circuitLeft: { begin: 0.65, dur: 0.85 },
  circuitLeftFill: { begin: 1.5, dur: 0.35 },
  rootLeft: { begin: 0.85, dur: 0.45 },
  rootRight: { begin: 0.95, dur: 0.45 },
  circuitDot: { begin: 1.15, dur: 0.25 },
  nodeLeft: { begin: 1.25, dur: 0.3 },
  nodeCenter: { begin: 1.4, dur: 0.3 },
  nodeRight: { begin: 1.5, dur: 0.3 },
  holeLeft: { begin: 1.55, dur: 0.25 },
  holeCenter: { begin: 1.7, dur: 0.25 },
  holeRight: { begin: 1.8, dur: 0.25 },
} as const;

function draw(id: keyof typeof T) {
  const { begin, dur } = T[id];
  return (
    <animate
      attributeName="stroke-dashoffset"
      from="1"
      to="0"
      begin={`${begin}s`}
      dur={`${dur}s`}
      fill="freeze"
      calcMode="spline"
      keySplines="0.3 0 0.2 1"
      keyTimes="0;1"
    />
  );
}

function fadeFill(id: keyof typeof T) {
  const { begin, dur } = T[id];
  return (
    <animate
      attributeName="fill-opacity"
      from="0"
      to="1"
      begin={`${begin}s`}
      dur={`${dur}s`}
      fill="freeze"
    />
  );
}

function grow(id: keyof typeof T, r: number) {
  const { begin, dur } = T[id];
  return (
    <animate
      attributeName="r"
      from="0"
      to={r}
      begin={`${begin}s`}
      dur={`${dur}s`}
      fill="freeze"
      calcMode="spline"
      keySplines="0.34 1.56 0.64 1"
      keyTimes="0;1"
    />
  );
}

export function LogoDraw({
  className,
  size = 340,
}: {
  className?: string;
  /** Rendered width in px. Height follows the mark's own ~1.8:1 aspect. */
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} className={cn("max-w-full", className)} style={{ width: size }}>
      {inView ? <AnimatedMark /> : null}
    </div>
  );
}

/**
 * The source file's `viewBox` is the full 1024x1024 artboard, but the mark
 * itself - anvil, circuits, everything the animation touches - only ever
 * occupies roughly x:218-806, y:334-656 inside it. That is where every
 * drawable path below lives; nothing is clipped by cropping to it.
 *
 * Rendering the full artboard meant three-quarters of this component's box
 * was blank margin, which read as an oversized empty square with a small
 * logo adrift in the middle of it. Cropping to the artwork's own bounds (plus
 * a small pad so the 1.15-width strokes at the anvil's own edge do not get
 * clipped) makes the rendered box exactly the shape of the mark - wide and
 * short, matching the 1.8:1 the silhouette mask used for the same reason.
 */
const VIEW_BOX = "205 320 615 350";

function AnimatedMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW_BOX}
      role="img"
      aria-labelledby="draw-title"
      className="block h-auto w-full"
    >
      <title id="draw-title">Druid Forge circuit-anvil logo</title>

      <defs>
        <linearGradient id="d-baseGradient" x1="218" y1="500" x2="806" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00d7ff" />
          <stop offset=".22" stopColor="#247eff" />
          <stop offset=".46" stopColor="#413fff" />
          <stop offset=".68" stopColor="#7627f7" />
          <stop offset="1" stopColor="#a916ec" />
        </linearGradient>

        <radialGradient id="d-topGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(450 334) rotate(2) scale(365 128)">
          <stop offset="0" stopColor="#00ffff" stopOpacity=".98" />
          <stop offset=".42" stopColor="#00ddff" stopOpacity=".68" />
          <stop offset=".78" stopColor="#00baff" stopOpacity=".20" />
          <stop offset="1" stopColor="#00aaff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="d-centerTopGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(536 344) rotate(0) scale(180 96)">
          <stop offset="0" stopColor="#03dfff" stopOpacity=".56" />
          <stop offset=".68" stopColor="#16bfff" stopOpacity=".18" />
          <stop offset="1" stopColor="#268cff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="d-leftFootGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(350 618) rotate(-8) scale(178 102)">
          <stop offset="0" stopColor="#00eaff" stopOpacity=".92" />
          <stop offset=".48" stopColor="#00cfff" stopOpacity=".55" />
          <stop offset="1" stopColor="#008cff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="d-rightFootGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(665 620) rotate(8) scale(190 115)">
          <stop offset="0" stopColor="#df35ff" stopOpacity=".34" />
          <stop offset=".62" stopColor="#bf25ff" stopOpacity=".12" />
          <stop offset="1" stopColor="#9b1df5" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="d-nodeLeftFill" x1="432" y1="398" x2="450" y2="416" gradientUnits="userSpaceOnUse">
          <stop stopColor="#08c9ff" />
          <stop offset="1" stopColor="#256cff" />
        </linearGradient>
        <linearGradient id="d-nodeCenterFill" x1="537" y1="422" x2="549" y2="434" gradientUnits="userSpaceOnUse">
          <stop stopColor="#247cff" />
          <stop offset="1" stopColor="#5636ff" />
        </linearGradient>
        <linearGradient id="d-nodeRightFill" x1="580" y1="383" x2="596" y2="399" gradientUnits="userSpaceOnUse">
          <stop stopColor="#218bff" />
          <stop offset="1" stopColor="#4a3aff" />
        </linearGradient>

        <clipPath id="d-anvilClip">
          <path d="M392 334 H683 V353 H806
C785.44 429.89 701.81 442.81 639 463
C558.84 506.12 625.27 607.66 699 604
V656 H599
C544.74 629.03 478.28 628.60 424 656
H323 V603
C400.65 610.17 464.01 498.71 379 461
C316.11 445.26 234.46 426.18 218 352
H392 Z" />
        </clipPath>
        <clipPath id="d-centerUpperClip">
          <rect x="420" y="350" width="155" height="206" />
        </clipPath>
      </defs>

      <g id="anvil">
        <path
          d="M392 334 H683 V353 H806
C785.44 429.89 701.81 442.81 639 463
C558.84 506.12 625.27 607.66 699 604
V656 H599
C544.74 629.03 478.28 628.60 424 656
H323 V603
C400.65 610.17 464.01 498.71 379 461
C316.11 445.26 234.46 426.18 218 352
H392 Z"
          fill="url(#d-baseGradient)"
          fillOpacity={0}
          stroke="#2450f2"
          strokeWidth="1.15"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          {draw("outline")}
          {fadeFill("bodyFill")}
        </path>

        <g id="d-anvil-lighting" clipPath="url(#d-anvilClip)" opacity={0}>
          <animate attributeName="opacity" from="0" to="1" begin={`${T.lighting.begin}s`} dur={`${T.lighting.dur}s`} fill="freeze" />
          <rect x="200" y="315" width="630" height="355" fill="url(#d-topGlow)" />
          <rect x="200" y="315" width="630" height="355" fill="url(#d-centerTopGlow)" />
          <rect x="200" y="315" width="630" height="355" fill="url(#d-leftFootGlow)" />
          <rect x="200" y="315" width="630" height="355" fill="url(#d-rightFootGlow)" />
          <path d="M228 365 C253 366 282 367 308 369 L348 390 C318 384 286 379 257 375 Z" fill="#88f8ff" opacity=".44" />
          <path d="M507 488 C506 541 484 590 447 622 C436 632 428 644 424 656 C451 647 474 640 497 636 C505 613 510 583 511 548 Z" fill="#2735ca" opacity=".22" />
          <path d="M514 489 C520 544 548 595 576 620 C587 631 595 644 599 656 C574 647 550 640 526 636 C520 613 515 582 513 548 Z" fill="#3200a5" opacity=".27" />
          <path d="M323 603 C365 598 398 586 420 565 C404 587 372 602 336 610 H323 Z" fill="#38e8ff" opacity=".20" />
          <path d="M699 604 C659 596 630 584 610 565 C630 591 661 609 699 617 Z" fill="#5b00ca" opacity=".14" />
        </g>

        <path
          d="M383 353 C383 362 386 375 391 386 V353 Z"
          fill="#f8ffff"
          fillOpacity={0}
          stroke="#c8ffff"
          strokeWidth=".55"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          {draw("notchDraw")}
          {fadeFill("notchFill")}
        </path>
      </g>

      <g
        id="d-circuit-markings"
        fill="#fbffff"
        stroke="#2752f4"
        strokeWidth="1.18"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        vectorEffect="non-scaling-stroke"
      >
        <rect x="478" y="359" width="10" height="59" fillOpacity={0}>
          {fadeFill("uprightFill")}
        </rect>

        <path
          d="M 505 359 L 505 456 L 504 457 L 502 457 L 480 446 L 478 444 L 478 434 L 453 417 L 455 413 L 455 404 L 452 398 L 448 394 L 441 392 L 435 393 L 430 396 L 426 404 L 426 410 L 429 417 L 431 419 L 437 422 L 445 422 L 470 440 L 469 442 L 470 443 L 470 452 L 502 467 L 505 470 L 505 552 L 504 553 L 504 557 L 500 567 L 490 583 L 479 597 L 472 604 L 485 590 L 494 578 L 497 572 L 499 570 L 500 571 L 500 575 L 501 573 L 503 575 L 502 578 L 494 589 L 479 604 L 496 587 L 509 568 L 509 566 L 511 565 L 512 568 L 521 581 L 539 600 L 568 621 L 544 597 L 533 584 L 521 567 L 514 551 L 514 408 L 540 391 L 540 359 L 531 359 L 531 385 L 515 397 L 514 396 L 514 359 Z"
          clipPath="url(#d-centerUpperClip)"
          fillOpacity={0}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          {draw("circuitUpper")}
          {fadeFill("circuitUpperFill")}
        </path>

        <path
          d="M 581 379 L 577 382 L 574 388 L 574 396 L 576 399 L 549 417 L 546 416 L 537 416 L 533 418 L 529 423 L 529 426 L 528 427 L 529 432 L 531 436 L 537 440 L 537 489 L 526 496 L 526 540 L 528 547 L 532 553 L 539 560 L 558 573 L 590 589 L 605 594 L 618 600 L 630 604 L 679 604 L 680 603 L 687 603 L 680 603 L 679 602 L 675 602 L 674 601 L 670 601 L 665 599 L 661 599 L 660 598 L 656 598 L 655 597 L 651 597 L 650 596 L 639 594 L 635 592 L 632 592 L 625 589 L 622 589 L 613 586 L 610 584 L 592 578 L 565 565 L 549 555 L 539 545 L 536 539 L 536 502 L 540 499 L 544 498 L 546 496 L 550 495 L 572 484 L 575 481 L 575 458 L 577 456 L 590 450 L 626 428 L 566 451 L 566 475 L 548 485 L 546 484 L 546 440 L 553 435 L 555 430 L 555 424 L 558 421 L 561 420 L 582 405 L 590 406 L 598 402 L 601 397 L 602 391 L 601 390 L 601 387 L 597 381 L 591 378 Z"
          fillOpacity={0}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          {draw("circuitRight")}
          {fadeFill("circuitRightFill")}
        </path>

        <path
          d="M 488 474 L 471 465 L 469 465 L 463 461 L 461 461 L 459 459 L 453 457 L 452 456 L 452 445 L 450 443 L 448 443 L 446 441 L 443 440 L 443 463 L 457 470 L 459 470 L 465 474 L 467 474 L 469 476 L 471 476 L 477 479 L 479 481 L 479 541 L 477 546 L 467 557 L 458 563 L 431 577 L 429 577 L 417 583 L 387 593 L 384 593 L 383 594 L 380 594 L 363 599 L 358 599 L 352 601 L 336 603 L 336 604 L 393 604 L 402 600 L 407 599 L 410 597 L 412 597 L 415 595 L 417 595 L 429 589 L 431 589 L 453 578 L 469 568 L 478 561 L 485 553 L 488 546 Z"
          fillOpacity={0}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          {draw("circuitLeft")}
          {fadeFill("circuitLeftFill")}
        </path>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M510 543 C509 563 496 584 473 604"
            stroke="#eef5ff"
            strokeWidth="5.2"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          >
            {draw("rootLeft")}
          </path>
          <path
            d="M510 543 C513 566 534 596 568 621"
            stroke="#dce7ff"
            strokeWidth="4.4"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          >
            {draw("rootRight")}
          </path>
        </g>

        <circle cx="441" cy="407" r={0}>{grow("nodeLeft", 15.1)}</circle>
        <circle cx="543" cy="428" r={0}>{grow("nodeCenter", 13.8)}</circle>
        <circle cx="588" cy="391" r={0}>{grow("nodeRight", 15.1)}</circle>
        <circle cx="564" cy="365" r={0}>{grow("circuitDot", 6.5)}</circle>

        <g stroke="#2752f4" strokeWidth="1.05">
          <circle cx="441" cy="407" r={0} fill="url(#d-nodeLeftFill)">{grow("holeLeft", 6.1)}</circle>
          <circle cx="543" cy="428" r={0} fill="url(#d-nodeCenterFill)">{grow("holeCenter", 4.9)}</circle>
          <circle cx="588" cy="391" r={0} fill="url(#d-nodeRightFill)">{grow("holeRight", 6.0)}</circle>
        </g>
      </g>
    </svg>
  );
}
