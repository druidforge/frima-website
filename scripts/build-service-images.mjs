/**
 * Builds the service showcase masters and their OG crops from the original
 * photographs.
 *
 * Run with `npm run build:service-images`. Sources default to
 * `~/Documents/slike-s-fotica`; override with `SERVICE_PHOTO_DIR`.
 *
 * Two things here are deliberate and easy to get wrong by hand:
 *
 * 1. Every source is piped through `.rotate()` with no argument, which applies
 *    the EXIF orientation tag. Twenty-six of the sixty-three photographs were
 *    shot with the camera turned, and a decoder that ignores the tag lays them
 *    on their side. The tag is not carried into the output - the pixels are
 *    already upright, so nothing downstream has to honour it.
 *
 * 2. Output filenames carry a content hash. `next.config.ts` serves everything
 *    under /public with `immutable, max-age=31536000`, which tells the image
 *    optimiser and every visiting browser to keep a copy for a year without
 *    revalidating. Replacing a photo at a stable path therefore ships an image
 *    that returning visitors never see. The hash makes the URL change whenever
 *    the bytes do, which is the condition `immutable` actually requires.
 *
 * The OG crop is a separate 480x630 PNG rather than a resize of the master at
 * request time: Satori, the renderer behind `ImageResponse`, neither resizes
 * images nor reliably decodes AVIF. It shares the master's hash so the pair can
 * never drift apart.
 */
import { createHash } from "node:crypto";
import { readdir, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const SRC_DIR =
  process.env.SERVICE_PHOTO_DIR ?? join(homedir(), "Documents", "slike-s-fotica");
/**
 * Sources that live in the repo rather than in the photo folder: rendered
 * artwork such as the template-gallery mockup, which has no camera original
 * to go back to. Kept out of `public/` on purpose - anything there is served
 * as-is, so a 1.6 MB master would be downloadable and crawlable at its own URL.
 */
const LOCAL_SRC_DIR = join(process.cwd(), "scripts", "sources");
const OUT_DIR = join(process.cwd(), "public", "services");
const OG_DIR = join(OUT_DIR, "og");

const MASTER = { quality: 62, effort: 7 };
const OG_SIZE = { w: 480, h: 630 };
/**
 * Palette PNG. Satori needs PNG, but these crops are only ever composited into
 * a 1200x630 card, so a full-colour one would spend several hundred kB apiece
 * on a difference no one viewing a social preview can see.
 */
const OG_ENCODE = { palette: true, quality: 90, effort: 10, compressionLevel: 9 };

/**
 * `focal` is the point of the source, in 0..1, that the crop centres on -
 * anything the ink wash at the bottom of a panel would swallow is pushed out
 * of frame rather than merely darkened.
 *
 * `rotate` is a clockwise correction applied after the EXIF orientation, for a
 * photograph whose subject is level but whose frame is not. `extract` then
 * takes a window of the rotated canvas, as fractions, because rotating by a
 * non-right angle leaves empty corners that no crop may include.
 */
const RECIPES = [
  { id: "website-design", src: "IMG_1718.JPG", out: [2000, 1333], focal: [0.5, 0.4] },
  { id: "web-applications", src: "IMG_1737.JPG", out: [2000, 1333], focal: [0.5, 0.5] },
  {
    id: "mobile-applications",
    src: "IMG_1747.JPG",
    rotate: 15,
    extract: { left: 0.43502, top: 0.21188, width: 0.34338, height: 0.64969 },
    out: [1333, 2000],
    focal: [0.5, 0.5],
  },
  { id: "wedding-invitation", src: "IMG_1756.JPG", out: [2000, 1651], focal: [0.52, 0.5] },
  { id: "business-card", src: "IMG_1749.JPG", out: [2000, 1333], focal: [0.45, 0.45] },
  { id: "flyer-design", src: "IMG_5155.JPG", out: [1333, 2000], focal: [0.56, 0.48] },
  /**
   * The template tier's panel image; the custom tier keeps `wedding-invitation`.
   *
   * `local` reads it from `scripts/sources/`. `out` is 4:3 at the source's own
   * width rather than the 2000px the photographs get: the source is a 2x
   * screenshot, 1308px wide, and scaling it up would add bytes, not detail.
   * `og: false` because a tier image is never used in a social card - the OG
   * image is per service and already has its crop.
   */
  {
    id: "wedding-invitation-templates",
    src: "wedding-invitation-templates.png",
    local: true,
    og: false,
    out: [1308, 981],
    focal: [0.5, 0.5],
  },
];

/** Oriented dimensions: EXIF tags 5-8 all swap the axes. */
function orientedSize({ width, height, orientation }) {
  return orientation >= 5 ? { width: height, height: width } : { width, height };
}

/**
 * Scale to cover, then take the target window around the focal point. This is
 * `object-fit: cover` with a settable origin, which sharp's own `position`
 * options cannot express.
 */
async function coverFocal(input, size, [tw, th], [fx, fy]) {
  const scale = Math.max(tw / size.width, th / size.height);
  const nw = Math.round(size.width * scale);
  const nh = Math.round(size.height * scale);
  const left = Math.min(Math.max(Math.round(fx * nw - tw / 2), 0), nw - tw);
  const top = Math.min(Math.max(Math.round(fy * nh - th / 2), 0), nh - th);
  return sharp(input)
    .resize(nw, nh, { fit: "fill" })
    .extract({ left, top, width: tw, height: th });
}

/** The oriented, deskewed source as a lossless buffer, plus its true size. */
async function prepare(recipe) {
  const path = join(recipe.local ? LOCAL_SRC_DIR : SRC_DIR, recipe.src);
  const meta = await sharp(path).metadata();

  if (!recipe.rotate) {
    return { input: path, size: orientedSize(meta) };
  }
  if (meta.orientation && meta.orientation !== 1) {
    // Chaining two rotations is not expressible in one sharp pipeline, so a
    // recipe that deskews may not also depend on an EXIF correction.
    throw new Error(`${recipe.src}: cannot deskew a source with an EXIF orientation`);
  }

  const { data, info } = await sharp(path)
    .rotate(recipe.rotate, { background: { r: 0, g: 0, b: 0 } })
    .png({ compressionLevel: 0 })
    .toBuffer({ resolveWithObject: true });

  const e = recipe.extract;
  const box = {
    left: Math.round(e.left * info.width),
    top: Math.round(e.top * info.height),
    width: Math.round(e.width * info.width),
    height: Math.round(e.height * info.height),
  };
  const cropped = await sharp(data).extract(box).png({ compressionLevel: 0 }).toBuffer();
  return { input: cropped, size: { width: box.width, height: box.height } };
}

async function main() {
  const results = [];

  /**
   * `--only id,id` rebuilds just those recipes. Adding one image should not
   * re-encode every photograph: a different sharp or libavif build can emit
   * different bytes for the same input, which means a new hash, a new URL and
   * a year of cached copies thrown away for pictures that did not change. The
   * cleanup below only ever touches recipes that ran, so the rest are safe.
   */
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;
  const recipes = only ? RECIPES.filter((r) => only.has(r.id)) : RECIPES;
  if (only && recipes.length !== only.size) {
    const known = new Set(RECIPES.map((r) => r.id));
    throw new Error(`unknown recipe id: ${[...only].filter((id) => !known.has(id)).join(", ")}`);
  }

  for (const recipe of recipes) {
    const { input, size } = await prepare(recipe);
    const oriented = recipe.rotate ? input : await sharp(input).rotate().toBuffer();

    // `removeAlpha` is a no-op for the JPEGs. A PNG source can carry an alpha
    // channel that is fully opaque - the template mockup does - and encoding it
    // would spend bytes on a channel that changes no pixel.
    const master = await (await coverFocal(oriented, size, recipe.out, recipe.focal))
      .removeAlpha()
      .avif(MASTER)
      .toBuffer();
    const hash = createHash("sha256").update(master).digest("hex").slice(0, 8);

    const masterName = `${recipe.id}.${hash}.avif`;
    await writeFile(join(OUT_DIR, masterName), master);

    if (recipe.og !== false) {
      const og = await (
        await coverFocal(oriented, size, [OG_SIZE.w, OG_SIZE.h], recipe.focal)
      )
        .png(OG_ENCODE)
        .toBuffer();
      await writeFile(join(OG_DIR, `${recipe.id}.${hash}.png`), og);
    }

    results.push({ ...recipe, hash, masterName, bytes: master.length });
    console.log(
      `${recipe.src.padEnd(14)} -> ${masterName.padEnd(34)} ` +
        `${recipe.out.join("x").padEnd(10)} ${(master.length / 1024).toFixed(0)} kB`,
    );
  }

  // Drop every earlier build of these services, masters and OG crops alike.
  const keep = new Set(results.flatMap((r) => [r.masterName, `${r.id}.${r.hash}.png`]));
  for (const [dir, files] of [
    [OUT_DIR, await readdir(OUT_DIR)],
    [OG_DIR, await readdir(OG_DIR)],
  ]) {
    for (const file of files) {
      const owned = results.some((r) => file === r.id || file.startsWith(`${r.id}.`));
      if (owned && !keep.has(file)) await unlink(join(dir, file));
    }
  }

  console.log("\nPaste into lib/services.ts:");
  for (const r of results) console.log(`  ${r.id}: "/services/${r.masterName}"`);
}

await main();
