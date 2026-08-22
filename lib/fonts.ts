import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";

/**
 * The three faces, declared once for the whole app.
 *
 * They live here rather than beside the layout because `next/font/google` keys
 * its module cache on the *options object*: two call sites that disagree by a
 * single field produce two independent font modules, each with its own
 * `@font-face` block and its own `.woff2` files. That is not a theoretical
 * risk - it had already happened. `app/global-error.tsx` and
 * `app/not-found.tsx` asked for `axes: ["opsz", "wdth"]` while the locale
 * layout asked for `axes: ["opsz"]`, so the build emitted Bricolage twice.
 *
 * The cost fell on every page. `global-error.tsx` is a client component in the
 * root `app/` segment, so its font module joins the chunk graph that every
 * route inherits, and Next preloads every font in that graph. The homepage was
 * fetching 185KB of a Bricolage variant it never set a single glyph in - 49% of
 * its total font payload, at `Highest` priority, against the paint the visitor
 * was waiting for.
 *
 * One module means that cannot recur. Import from here; do not re-declare.
 */

export const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  /**
   * `wdth` dropped: every extra variable axis makes Google Fonts serve a
   * larger file, and this one was inert - it only ever applies through
   * `font-stretch`, which nothing in this project sets. The face was the
   * single heaviest resource on the homepage (129KB, still arriving at ~3.1s
   * on throttled mobile) and it gates the hero's own text.
   *
   * `opsz` stays. Unlike `wdth` it is live without being written anywhere:
   * `font-optical-sizing` defaults to `auto`, so the browser already varies
   * it by font size - which is exactly what keeps the huge hero headline
   * from looking like the body face scaled up.
   */
  axes: ["opsz"],
});

export const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500"],
  /**
   * Not preloaded, unlike the other two.
   *
   * A preload is a claim that the file is needed for the first paint, and the
   * browser honours it at the highest priority it has - ahead of the stylesheet
   * and the document's own remaining bytes. This face earns none of that. It is
   * reached only through `--font-mono`, which the design uses for the eyebrow
   * labels (0.75rem) and the hero's scroll cue (0.65rem): small uppercase
   * decoration, never an LCP candidate. Two files, 43KB, competing with the
   * headline for a throttled mobile pipe.
   *
   * Dropping the preload does not drop the font - the `@font-face` is still
   * emitted and the browser fetches it on discovering the CSS, just at a normal
   * priority. `display: swap` plus the `size-adjust`-corrected
   * `JetBrains Mono Fallback` that Next generates means the label paints in a
   * metric-matched fallback first and swaps, which is what already happens on
   * any cold load today.
   */
  preload: false,
});
