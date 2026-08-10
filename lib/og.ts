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
