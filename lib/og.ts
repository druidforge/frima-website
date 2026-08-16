import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The mark as a data URI.
 *
 * Satori (the renderer behind ImageResponse) cannot reach the network or the
 * public folder, so the mark has to be inlined. Read once at module scope -
 * these routes run at build time.
 *
 * The raster master rather than the vector: these cards are rasterised anyway,
 * the mark is drawn large on them, and Satori's SVG support is partial.
 */
export const markDataUri = (() => {
  const png = readFileSync(
    join(process.cwd(), "public", "brand", "druid-forge-768.png"),
  );
  return `data:image/png;base64,${png.toString("base64")}`;
})();

export const ogSize = { width: 1200, height: 630 };

/**
 * Per-service photo, pre-cropped to the card's fixed photo-panel box.
 *
 * Cropped once with sharp (480x630, "cover") rather than at request time:
 * Satori has no image resizing of its own, and the source masters are AVIF,
 * a format `ImageResponse`'s renderer does not reliably decode - the same
 * reason `markDataUri` above reads a PNG rather than the brand SVG. `basename`
 * is a service's `image` field with the directory and extension stripped, so
 * `/services/website-design.avif` reads `public/services/og/website-design.png`.
 *
 * Cached per basename - these routes are prerendered once per locale/service
 * pair at build time, and would otherwise re-read the same handful of files
 * repeatedly.
 */
export const serviceOgImageDataUri = (() => {
  const cache = new Map<string, string>();
  return (basename: string) => {
    const cached = cache.get(basename);
    if (cached) return cached;
    const png = readFileSync(
      join(process.cwd(), "public", "services", "og", `${basename}.png`),
    );
    const uri = `data:image/png;base64,${png.toString("base64")}`;
    cache.set(basename, uri);
    return uri;
  };
})();
