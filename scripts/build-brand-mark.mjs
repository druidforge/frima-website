/**
 * Builds the raster mark the About page settles on after its draw animation.
 *
 * Run with `node scripts/build-brand-mark.mjs`.
 *
 * The source is `resources/logo/druid-forge-logo.png`, the 1024x1024 master.
 * It shares its coordinate system with the paths in `components/logo-draw.tsx`
 * - the anvil spans x:217-806, y:334-656 in both - so cropping the master to
 * that component's `VIEW_BOX` gives a raster that lands exactly where the
 * drawing finishes, and the crossfade between them does not shift a pixel.
 * Keep `CROP` and `VIEW_BOX` in step.
 *
 * Why the swap exists at all: the vector trace has strokes in the wrong
 * colour and curves that do not follow the artwork. It is fine as a sketch
 * while it draws; the finished mark a visitor looks at is the master.
 *
 * The output carries a content hash for the same reason the service images do:
 * `next.config.ts` serves `/public` images `immutable` for a year.
 */
import { createHash } from "node:crypto";
import { readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "..", "resources", "logo", "druid-forge-logo.png");
const OUT_DIR = join(ROOT, "public", "brand");
const NAME = "druid-forge-mark";

/** `VIEW_BOX` in `components/logo-draw.tsx`: "205 320 615 350". */
const CROP = { left: 205, top: 320, width: 615, height: 350 };

// Higher than the photographs' 62: a logo is flat colour and hard edges, which
// is where AVIF's low settings smear first. Alpha is kept - the mark sits on
// the violet ground of the section.
const master = await sharp(SOURCE).extract(CROP).avif({ quality: 80, effort: 9 }).toBuffer();
const hash = createHash("sha256").update(master).digest("hex").slice(0, 8);
const file = `${NAME}.${hash}.avif`;

await writeFile(join(OUT_DIR, file), master);
for (const existing of await readdir(OUT_DIR)) {
  if (existing.startsWith(`${NAME}.`) && existing !== file) {
    await unlink(join(OUT_DIR, existing));
  }
}

console.log(`${file}  ${CROP.width}x${CROP.height}  ${(master.length / 1024).toFixed(1)} kB`);
console.log(`\nPaste into components/logo-draw.tsx:\n  const MARK_SRC = "/brand/${file}";`);
