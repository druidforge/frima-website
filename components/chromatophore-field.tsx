"use client";

import { useEffect, useRef } from "react";

import { cn, mulberry32 } from "@/lib/utils";

/**
 * The signature element.
 *
 * Octopus skin is covered in chromatophores - pigment sacs ringed by muscle.
 * When the muscles pull, the sac flattens and the colour shows; when they
 * release, it shrinks to a dot. Waves of that expansion travel across the
 * animal. This renders that mechanic literally: a jittered field of cells,
 * driven by travelling sine fronts, coloured along the studio's cyan -> violet
 * ramp.
 *
 * With `silhouette`, cells that fall inside the octopus mark hold a permanent
 * expansion bias, so the animal resolves out of the noise and disperses again
 * as the section scrolls away.
 *
 * Performance notes:
 * - Cells are bucketed by colour so a whole bucket draws in one path fill.
 *   Roughly 4000 cells cost ~28 fill calls per frame instead of 4000.
 * - The loop stops when the canvas leaves the viewport or the tab is hidden.
 */

const BUCKETS = 28;

type Props = {
  seed?: number;
  /** Hue rotation applied to each end of the cyan -> violet ramp, in degrees. */
  hue?: [number, number];
  /** Target spacing between cells in CSS pixels. Lower is denser and costlier. */
  spacing?: number;
  /** Overall opacity ceiling of the field. */
  intensity?: number;
  /** Resolve the octopus mark out of the field. */
  silhouette?: boolean;
  /** Follow the pointer with a local bloom. */
  interactive?: boolean;
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

export function ChromatophoreField({
  seed = 17,
  hue = [0, 0],
  spacing = 22,
  intensity = 1,
  silhouette = false,
  interactive = true,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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

    const ramp = buildRamp(hue);

    function buildCells(maskData: Uint8ClampedArray | null, maskW: number) {
      const rand = mulberry32(seed);
      const next: Cell[] = [];
      const stepY = spacing * 0.866; // hex packing keeps gaps even
      const rows = Math.ceil(height / stepY) + 1;
      const cols = Math.ceil(width / spacing) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const offset = row % 2 === 0 ? 0 : spacing / 2;
          const jx = (rand() - 0.5) * spacing * 0.45;
          const jy = (rand() - 0.5) * spacing * 0.45;
          const x = col * spacing + offset + jx;
          const y = row * stepY + jy;
          if (x < -spacing || x > width + spacing) continue;

          let mask = 0;
          if (maskData) {
            const mx = Math.floor((x / width) * maskW);
            const my = Math.floor((y / height) * maskW);
            if (mx >= 0 && mx < maskW && my >= 0 && my < maskW) {
              mask = maskData[(my * maskW + mx) * 4 + 3] / 255;
            }
          }

          const angle = rand() * Math.PI * 2;
          next.push({
            x,
            y,
            phase: rand() * Math.PI * 2,
            scale: 0.55 + rand() * 0.75,
            ramp: rand(),
            mask,
            driftX: Math.cos(angle),
            driftY: Math.sin(angle),
          });
        }
      }
      cells = next;
    }

    /** Rasterise the octopus mark once and read its alpha channel. */
    function loadMask(): Promise<{
      data: Uint8ClampedArray;
      size: number;
    } | null> {
      if (!silhouette) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const size = 220;
          const off = document.createElement("canvas");
          off.width = size;
          off.height = size;
          const octx = off.getContext("2d", { willReadFrequently: true });
          if (!octx) return resolve(null);
          // Contain the square mark inside the square sample buffer.
          octx.drawImage(img, 0, 0, size, size);
          try {
            resolve({ data: octx.getImageData(0, 0, size, size).data, size });
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = "/octopus_silhouette_gradient.svg";
      });
    }

    let mask: { data: Uint8ClampedArray; size: number } | null = null;

    /**
     * Silhouette coverage at a point in canvas space, 0..1.
     *
     * Reads the same rasterised mask the cells were built from, so "is the
     * pointer on the animal" is answered by the artwork itself rather than by
     * an approximated hit box.
     */
    function maskAt(x: number, y: number) {
      if (!mask) return 0;
      const mx = Math.floor((x / width) * mask.size);
      const my = Math.floor((y / height) * mask.size);
      if (mx < 0 || mx >= mask.size || my < 0 || my >= mask.size) return 0;
      return mask.data[(my * mask.size + mx) * 4 + 3] / 255;
    }

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCells(mask?.data ?? null, mask?.size ?? 0);
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
      // by touching the octopus rather than a cursor trail across the hero.
      // `onSilhouette` eases rather than switching, so crossing the outline
      // fades the response in instead of popping it.
      const overMark = silhouette ? maskAt(pointer.x, pointer.y) : 1;
      pointer.onMark += (overMark - pointer.onMark) * 0.16;

      ctx!.clearRect(0, 0, width, height);

      // One path per colour bucket keeps state changes off the hot loop.
      const paths: Path2D[] = Array.from(
        { length: BUCKETS },
        () => new Path2D(),
      );
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
          energy = energy * (0.28 + c.mask * 0.35) + c.mask * 0.62;
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
        const spread = disperse * spacing * 1.6;
        const radius =
          Math.max(0, energy) *
          c.scale *
          (spacing * 0.3) *
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
        paths[bucket].moveTo(px + radius, py);
        paths[bucket].arc(px, py, radius, 0, Math.PI * 2);
        drew = true;
      }

      if (drew) {
        const fade = intensity * (1 - disperse * 0.55);
        for (let b = 0; b < BUCKETS; b++) {
          ctx!.fillStyle = ramp[b];
          ctx!.globalAlpha = Math.max(
            0,
            fade * (0.18 + (b / (BUCKETS - 1)) * 0.62),
          );
          ctx!.fill(paths[b]);
        }
        ctx!.globalAlpha = 1;
      }

      pointer.power *= 0.96;

      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (running) return;
      running = true;
      start = performance.now() - 1200; // skip the dead first second
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      cancelAnimationFrame(raf);
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
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { rootMargin: "120px" },
    );

    const resizeObserver = new ResizeObserver(() => resize());

    function onVisibility() {
      if (document.hidden) pause();
      else observer.observe(wrap!);
    }

    let cancelled = false;
    loadMask().then((m) => {
      if (cancelled) return;
      mask = m;
      resize();
      resizeObserver.observe(wrap!);
      observer.observe(wrap!);
      document.addEventListener("visibilitychange", onVisibility);
      if (interactive) {
        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        window.addEventListener("pointerleave", onPointerLeave);
      }
    });

    return () => {
      cancelled = true;
      pause();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [seed, hue, spacing, intensity, silhouette, interactive]);

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
