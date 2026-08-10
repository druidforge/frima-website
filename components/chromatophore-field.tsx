"use client";

import { useEffect, useRef } from "react";

import { cn, mulberry32 } from "@/lib/utils";

/**
 * The signature element.
 *
 * A jittered field of cells driven by travelling sine fronts, coloured along
 * the studio's cyan -> violet ramp. Each cell swells and shrinks as the fronts
 * pass, so the surface reads as something heated rather than as a particle
 * effect - embers over a forge, not snow.
 *
 * The component keeps its original name: the mechanic is borrowed from
 * chromatophores, the pigment sacs that let cephalopod skin ripple colour.
 *
 * With `silhouette`, cells that fall inside the mark hold a permanent expansion
 * bias, so it resolves out of the noise and disperses again as the section
 * scrolls away.
 *
 * Performance notes:
 * - Cells are bucketed by colour so a whole bucket draws in one path fill.
 *   Roughly 4000 cells cost ~28 fill calls per frame instead of 4000.
 * - Nothing is built until the canvas is near the viewport, and the loop stops
 *   again when it leaves or the tab is hidden. See `init` below - this matters
 *   far more than it sounds, because the home page mounts nine of these.
 * - The silhouette raster is shared process-wide rather than rebuilt per
 *   instance. See `loadMask`.
 */

const BUCKETS = 28;

/**
 * Ceiling on cells per field.
 *
 * Cost per frame is linear in cell count, and cell count is quadratic in
 * viewport size - the hero at `spacing: 16` wants ~5900 cells on a laptop but
 * ~16900 on a 1440p display, which is where the frame budget went. Past this
 * count the spacing is widened until the field fits, so a large monitor gets a
 * slightly sparser field instead of a slower one. Sized so ordinary laptop and
 * desktop viewports never hit it and nothing about the current look changes.
 */
const MAX_CELLS = 9000;

type Props = {
  seed?: number;
  /** Hue rotation applied to each end of the cyan -> violet ramp, in degrees. */
  hue?: [number, number];
  /** Target spacing between cells in CSS pixels. Lower is denser and costlier. */
  spacing?: number;
  /** Overall opacity ceiling of the field. */
  intensity?: number;
  /** Resolve the brand mark out of the field. */
  silhouette?: boolean;
  /** Mark size as a fraction of the container's shorter side. */
  markScale?: number;
  /** Mark centre, 0..1 across the container. */
  markX?: number;
  markY?: number;
  /** Follow the pointer with a local bloom. */
  interactive?: boolean;
  /**
   * Whether this field should animate at all.
   *
   * For fields that are visually hidden until some parent state - the service
   * stack's cards keep theirs at `opacity-0` until hover - being in the
   * viewport is not the same as being seen. Passing `false` keeps the loop
   * stopped so six invisible canvases are not driving six invisible animations.
   */
  active?: boolean;
  className?: string;
};

type Cell = {
  x: number;
  y: number;
  /** Phase offset so neighbours do not pulse in lockstep. */
  phase: number;
  /** Per-cell size multiplier. */
  scale: number;
  /** Position along the colour ramp, 0..1. */
  ramp: number;
  /** Alpha of the silhouette mask at this point, 0..1. */
  mask: number;
  /** Direction this cell drifts when the field disperses. */
  driftX: number;
  driftY: number;
};

/** Rasterised mark. Immutable once built, which is what makes it shareable. */
type Mask = {
  data: Uint8ClampedArray;
  size: number;
  /** Bounds of the drawn artwork inside the square buffer, 0..1. */
  box: { x0: number; y0: number; x1: number; y1: number };
};

/**
 * The mark, rasterised once for the whole page.
 *
 * Every silhouette field used to do this itself, on every mount: decode the
 * SVG, draw it to a 384x384 buffer, pull 590KB back out with `getImageData`,
 * then walk all 147456 pixels to find the artwork's true bounds. That is
 * several milliseconds of main thread, and it was paid again by every instance
 * and again after every client navigation - right at the moment the new page
 * was trying to paint.
 *
 * The result depends on nothing but the file, so it is computed once and the
 * promise is kept. Later callers await the same raster. It is only ever read.
 */
let maskRequest: Promise<Mask | null> | null = null;

function loadMask(): Promise<Mask | null> {
  maskRequest ??= new Promise<Mask | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 384;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return resolve(null);
      // Contain the square mark inside the square sample buffer.
      octx.drawImage(img, 0, 0, size, size);
      try {
        const data = octx.getImageData(0, 0, size, size).data;

        /**
         * The artwork carries a wide transparent margin inside its own
         * viewBox - the anvil fills barely a third of the square. Fitting
         * the raw buffer therefore drew it small and squashed. Measuring
         * where the ink actually is lets the mark be placed by its own
         * bounds instead of the file's padding.
         */
        let x0 = size;
        let y0 = size;
        let x1 = 0;
        let y1 = 0;
        for (let i = 0; i < size * size; i++) {
          if (data[i * 4 + 3] < 24) continue;
          const x = i % size;
          const y = (i / size) | 0;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
        if (x1 <= x0 || y1 <= y0) return resolve(null);

        resolve({
          data,
          size,
          box: {
            x0: x0 / size,
            y0: y0 / size,
            x1: (x1 + 1) / size,
            y1: (y1 + 1) / size,
          },
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = "/druid-forge.svg";
  });

  return maskRequest;
}

/**
 * Run `fn` when the browser is not busy, with a firm deadline.
 *
 * Field setup - rasterising, laying out thousands of cells, sizing the canvas -
 * is decorative work competing with a navigation that is trying to paint. Idle
 * time is exactly the right budget for it, and the timeout keeps it from being
 * postponed indefinitely on a busy page.
 */
function scheduleIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: 400 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 1);
  return () => clearTimeout(id);
}

export function ChromatophoreField({
  seed = 17,
  hue = [0, 0],
  spacing = 22,
  intensity = 1,
  silhouette = false,
  markScale = 0.82,
  markX = 0.5,
  markY = 0.5,
  interactive = true,
  active = true,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** Lets the `active` prop reach a running loop without rebuilding it. */
  const controlRef = useRef<((next: boolean) => void) | null>(null);

  // `hue` is a tuple, and callers write it inline (`hue={[-14, 16]}`), so it is
  // a new array on every render of every parent. Listing it here as-is meant
  // any unrelated re-render tore the whole field down and rebuilt it - canvas,
  // raster and all. The two numbers are what the effect actually depends on.
  const [hueFrom, hueTo] = hue;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let cells: Cell[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let start = performance.now();
    let mask: Mask | null = null;
    /** Set once the canvas has been sized and its cells laid out. */
    let ready = false;
    /** Is the canvas near the viewport, per the observer below. */
    let onScreen = false;
    /** The `active` prop, as last seen by this loop. */
    let wanted = active;
    let cancelled = false;
    let cancelIdle: (() => void) | null = null;

    // Pointer bloom, eased toward the real cursor so it never snaps.
    // `onMark` is the eased 0..1 answer to "is the pointer on the silhouette",
    // kept separate from `power` so leaving the mark and leaving the section
    // fade out independently.
    const pointer = {
      x: -9999,
      y: -9999,
      tx: -9999,
      ty: -9999,
      power: 0,
      onMark: 0,
    };
    // 0 while the section is centred, rising to 1 as it leaves the viewport.
    let disperse = 0;

    const ramp = buildRamp([hueFrom, hueTo]);

    /**
     * Where the mark sits, in canvas pixels.
     *
     * The mask is a square raster, and it used to be stretched across the full
     * container - fine for a blob, but it flattened the anvil into an unreadable
     * smear on a wide hero. Fitting it to a square box instead keeps the
     * artwork's proportions whatever shape the section is.
     */
    function markBox() {
      if (!mask) return null;
      const { x0, y0, x1, y1 } = mask.box;
      // The anvil is roughly 1.8:1, so a square box would stretch it.
      const aspect = (x1 - x0) / (y1 - y0);
      let h = height * markScale;
      let w = h * aspect;
      const maxW = width * 0.94;
      if (w > maxW) {
        w = maxW;
        h = w / aspect;
      }
      return { w, h, left: width * markX - w / 2, top: height * markY - h / 2 };
    }

    /** Alpha of the mark at a canvas point, 0..1, sharpened at the edge. */
    function sampleMark(x: number, y: number) {
      if (!mask) return 0;
      const box = markBox();
      if (!box) return 0;
      const u = (x - box.left) / box.w;
      const v = (y - box.top) / box.h;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) return 0;

      // Remap into the artwork's own bounds, skipping the file's padding.
      const { x0, y0, x1, y1 } = mask.box;
      const mx = Math.floor((x0 + u * (x1 - x0)) * mask.size);
      const my = Math.floor((y0 + v * (y1 - y0)) * mask.size);
      const alpha = mask.data[(my * mask.size + mx) * 4 + 3] / 255;
      // The anvil has thin circuit traces; squaring the falloff keeps their
      // edges crisp instead of smearing them into the surrounding field.
      return alpha * alpha;
    }

    /**
     * The spacing `buildCells` actually used, which drives cell radii and the
     * disperse spread. Distinct from the `spacing` prop because a large
     * viewport can widen it - see `fittedSpacing`. Reading the prop here
     * instead would draw cells sized for a density the field is not using.
     */
    let cellSpacing = spacing;

    /** Widen the spacing until the field fits inside `MAX_CELLS`. See above. */
    function fittedSpacing() {
      let step = spacing;
      for (let guard = 0; guard < 24; guard++) {
        const rows = Math.ceil(height / (step * 0.866)) + 1;
        const cols = Math.ceil(width / step) + 1;
        if (rows * cols <= MAX_CELLS) break;
        step *= 1.1;
      }
      return step;
    }

    function buildCells() {
      const rand = mulberry32(seed);
      const next: Cell[] = [];
      const step = fittedSpacing();
      const stepY = step * 0.866; // hex packing keeps gaps even
      const rows = Math.ceil(height / stepY) + 1;
      const cols = Math.ceil(width / step) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const offset = row % 2 === 0 ? 0 : step / 2;
          const jx = (rand() - 0.5) * step * 0.45;
          const jy = (rand() - 0.5) * step * 0.45;
          const x = col * step + offset + jx;
          const y = row * stepY + jy;
          if (x < -step || x > width + step) continue;

          const cellMask = sampleMark(x, y);

          const angle = rand() * Math.PI * 2;
          next.push({
            x,
            y,
            phase: rand() * Math.PI * 2,
            scale: 0.55 + rand() * 0.75,
            ramp: rand(),
            mask: cellMask,
            driftX: Math.cos(angle),
            driftY: Math.sin(angle),
          });
        }
      }
      cells = next;
      cellSpacing = step;
    }

    /**
     * Silhouette coverage at a point in canvas space, 0..1.
     *
     * Reads the same rasterised mask the cells were built from, so "is the
     * pointer on the animal" is answered by the artwork itself rather than by
     * an approximated hit box.
     */
    function maskAt(x: number, y: number) {
      return sampleMark(x, y);
    }

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      // A ResizeObserver fires once on observe, and again for changes that do
      // not alter the box we care about. Rebuilding thousands of cells for an
      // unchanged size is pure waste.
      if (ready && nextWidth === width && nextHeight === height) return;

      width = nextWidth;
      height = nextHeight;
      // Ambient fields are soft blobs with no edges to preserve, so capping
      // their backing store below the display density costs nothing visible and
      // saves a large share of the fill area on retina screens. The silhouette
      // has an outline to hold, so it keeps the full ratio.
      const dpr = Math.min(window.devicePixelRatio || 1, silhouette ? 2 : 1.5);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCells();
    }

    function frame(now: number) {
      const t = (now - start) / 1000;

      // Track how far this section has drifted from the viewport centre.
      const rect = wrap!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const centre = rect.top + rect.height / 2;
      disperse = Math.min(1, Math.abs(centre - vh / 2) / (vh * 0.9));

      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;

      // The bloom belongs to the animal, not the section. Off the silhouette
      // the pointer does nothing at all, so the effect is something you find
      // by touching the mark rather than a cursor trail across the hero.
      // `onSilhouette` eases rather than switching, so crossing the outline
      // fades the response in instead of popping it.
      const overMark = silhouette ? maskAt(pointer.x, pointer.y) : 1;
      pointer.onMark += (overMark - pointer.onMark) * 0.16;

      ctx!.clearRect(0, 0, width, height);

      // One path per colour bucket keeps state changes off the hot loop.
      //
      // Allocated on demand rather than up front: a quiet field leaves most of
      // the ramp empty, and eagerly building all 28 meant 28 objects per frame
      // per canvas thrown away again immediately - on the home page, north of
      // fifteen thousand short-lived allocations a second, and the GC pauses
      // that come with them.
      const paths: Array<Path2D | undefined> = new Array(BUCKETS);
      let drew = false;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];

        // Two travelling fronts at different angles read as skin, where a
        // single wave reads as a screensaver.
        const w1 = Math.sin(c.x * 0.006 + c.y * 0.004 - t * 0.9 + c.phase);
        const w2 = Math.sin(c.x * -0.0032 + c.y * 0.0075 + t * 0.55);
        let energy = (w1 * 0.6 + w2 * 0.4) * 0.5 + 0.5;

        // Silhouette cells stay expanded; the surrounding field stays quiet.
        if (silhouette) {
          energy = energy * (0.16 + c.mask * 0.34) + c.mask * 0.9;
        }

        // Gated twice over: the pointer has to be on the mark, and the cell
        // being lit has to be part of it. Edge cells hold a partial mask value,
        // so the bloom fades out along the outline instead of cutting off.
        const reach = interactive ? pointer.power * pointer.onMark : 0;
        if (reach > 0.01) {
          const dx = c.x - pointer.x;
          const dy = c.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const r = 165;
          if (d2 < r * r) {
            const falloff = 1 - Math.sqrt(d2) / r;
            const local = silhouette ? c.mask : 1;
            energy += falloff * falloff * 1.15 * reach * local;
          }
        }

        // Disperse: cells shrink and drift apart as the section leaves.
        const spread = disperse * cellSpacing * 1.6;
        const radius =
          Math.max(0, energy) *
          c.scale *
          (cellSpacing * 0.3) *
          (1 - disperse * 0.75);
        if (radius < 0.25) continue;

        const bucket = Math.min(
          BUCKETS - 1,
          Math.max(
            0,
            Math.round((c.ramp * 0.45 + energy * 0.55) * (BUCKETS - 1)),
          ),
        );
        const px = c.x + c.driftX * spread;
        const py = c.y + c.driftY * spread;
        const path = (paths[bucket] ??= new Path2D());
        path.moveTo(px + radius, py);
        path.arc(px, py, radius, 0, Math.PI * 2);
        drew = true;
      }

      if (drew) {
        const fade = intensity * (1 - disperse * 0.55);
        for (let b = 0; b < BUCKETS; b++) {
          const path = paths[b];
          if (!path) continue;
          ctx!.fillStyle = ramp[b];
          ctx!.globalAlpha = Math.max(
            0,
            fade * (0.18 + (b / (BUCKETS - 1)) * 0.62),
          );
          ctx!.fill(path);
        }
        ctx!.globalAlpha = 1;
      }

      pointer.power *= 0.96;

      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (running || !ready || !onScreen || !wanted || document.hidden) return;
      running = true;
      start = performance.now() - 1200; // skip the dead first second
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /**
     * First-touch setup, deferred until the field is actually near the screen.
     *
     * Previously every field on the page sized itself and laid out its cells at
     * mount, whether or not it would ever be seen - and did it again on the
     * next navigation. The home page mounts nine, so that was nine canvases and
     * ~20000 cells of setup competing with the paint the visitor was waiting
     * for. Now the observer decides: a field that never scrolls into view never
     * costs anything at all.
     */
    function init() {
      if (ready || cancelIdle) return;
      cancelIdle = scheduleIdle(() => {
        cancelIdle = null;
        if (cancelled || ready) return;

        void loadMask().then((m) => {
          if (cancelled || ready) return;
          mask = m;
          resize();
          ready = true;
          resizeObserver.observe(wrap!);
          play();
        });
      });
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      pointer.power = 1;
    }

    function onPointerLeave() {
      pointer.power = 0;
      pointer.tx = -9999;
      pointer.ty = -9999;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (!onScreen) return pause();
        if (wanted) init();
        play();
      },
      { rootMargin: "120px" },
    );

    const resizeObserver = new ResizeObserver(() => resize());

    function onVisibility() {
      if (document.hidden) pause();
      else play();
    }

    // Lets the `active` prop start and stop the loop without tearing the field
    // down and rebuilding it on every hover.
    controlRef.current = (next: boolean) => {
      wanted = next;
      if (!next) return pause();
      if (onScreen) init();
      play();
    };

    observer.observe(wrap);
    document.addEventListener("visibilitychange", onVisibility);
    if (interactive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelled = true;
      controlRef.current = null;
      cancelIdle?.();
      pause();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
    // `active` is deliberately absent: it is delivered through `controlRef` by
    // the effect below, so toggling it starts and stops the loop instead of
    // rebuilding the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    seed,
    hueFrom,
    hueTo,
    spacing,
    intensity,
    silhouette,
    markScale,
    markX,
    markY,
    interactive,
  ]);

  useEffect(() => {
    controlRef.current?.(active);
  }, [active]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/** Precomputes the cyan -> violet ramp into `BUCKETS` flat colour strings. */
function buildRamp([h0, h1]: [number, number]) {
  const from = { h: 183 + h0, s: 96, l: 48 };
  const to = { h: 268 + h1, s: 96, l: 64 };
  return Array.from({ length: BUCKETS }, (_, i) => {
    const p = i / (BUCKETS - 1);
    const h = from.h + (to.h - from.h) * p;
    const s = from.s + (to.s - from.s) * p;
    const l = from.l + (to.l - from.l) * p;
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  });
}
