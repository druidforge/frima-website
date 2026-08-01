import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The octopus mark as a data URI.
 *
 * Satori (the renderer behind ImageResponse) cannot reach the network or the
 * public folder, so the mark has to be inlined. Read once at module scope -
 * these routes run at build time.
 */
export const octopusDataUri = (() => {
  const svg = readFileSync(
    join(process.cwd(), "public", "octopus_silhouette_gradient.svg"),
    "utf8",
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
})();

export const ogSize = { width: 1200, height: 630 };
