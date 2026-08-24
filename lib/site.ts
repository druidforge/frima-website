/**
 * Single source of truth for business facts that appear in metadata, JSON-LD,
 * the footer, and the legal pages. Everything below is real, sourced from the
 * obrt's own register extract (sudreg.pravosudje.hr) - `legalName` deliberately
 * omits the owner and address, which the register extract also lists, since
 * both already have their own fields here; repeating them inline in every
 * sentence that interpolates `legalName` would just duplicate itself.
 */
export const site = {
  name: "Druid Forge",
  legalName: "Druid Forge, obrt za proizvodnju, usluge i umjetničko stvaralaštvo",
  owner: "Jurica Milić",
  oib: "89043488267",
  registration: {
    /** Matični broj obrta - the craft register's own identifier. */
    mbo: "99349841",
    craftLicenseNumber: "17010019269",
    authority: "Upravni odjel za gospodarstvo, EU fondove i poljoprivredu Split",
  },
  email: "druidforgeinfo@gmail.com",
  phone: "+385 95 524 8865",
  address: {
    street: "Požeška ulica 8",
    city: "Split",
    postalCode: "21000",
    country: "HR",
    countryName: "Hrvatska",
  },
  geo: { lat: 43.5081, lng: 16.4402 },
  /**
   * Date the obrt was entered in the craft register, ISO 8601 for schema.org's
   * `foundingDate`. The studio dates from the same year, so this and the "since
   * 2026" line in the About copy (`about.lead`) describe one start, not two -
   * keep them in step if either ever changes.
   */
  founded: "2026-08-13",
  /**
   * Contact and profile links used across the UI. Not every entry here is a
   * `sameAs` candidate - see `components/structured-data.tsx` for which ones
   * actually represent the business as an entity.
   *
   * No LinkedIn: the only account is a personal `/in/` profile, which stands
   * for a person rather than for Druid Forge. Add one here when a real
   * company page exists.
   */
  social: {
    instagram: "https://instagram.com/druid.forge",
    /**
     * Facebook has not been given a username yet, so this is the numeric
     * `profile.php?id=` form. It is canonical and resolves fine; swap it for
     * the vanity URL once one is claimed, and `sameAs` picks that up with it.
     */
    facebook: "https://www.facebook.com/profile.php?id=61593599047218",
    whatsapp: "https://wa.me/385955617511",
    github: "https://github.com/druidforge",
  },
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://druid-forge.hr";

/**
 * Whether this deployment is allowed to be indexed.
 *
 * Vercel builds every branch and every pull request at its own
 * `*.vercel.app` URL, serving a byte-identical site. Left alone those
 * previews are crawlable, which is how a staging copy ends up competing with
 * the real domain for its own content.
 *
 * `VERCEL_ENV` is "production" | "preview" | "development" on Vercel, and
 * undefined anywhere else. Only the two explicit non-production values are
 * blocked, so a self-hosted build or a local `next start` still behaves like
 * production rather than silently shipping `noindex` to a real site.
 *
 * Read at build time, which is correct: these routes are all statically
 * generated, so the value baked in is the one for that deployment.
 */
export const isIndexableDeployment =
  process.env.VERCEL_ENV !== "preview" &&
  process.env.VERCEL_ENV !== "development";

/** Handle shown as link text on the contact page - derived so it can't drift
 *  from `site.social.instagram`, the actual source of truth for the URL. */
export const instagramHandle = `@${site.social.instagram.split("/").pop()}`;

/**
 * The two people behind the studio each take their own calls. Duje's number
 * is the same one `site.phone` already uses everywhere else (JSON-LD, the
 * Impressum, the thank-you email) - it stays the single "business" number
 * for those; this is only for the two name-linked numbers on the footer and
 * the contact page.
 */
export const team = {
  duje: { phone: site.phone },
  dominko: { phone: "+385 95 561 7511" },
} as const;

/**
 * `site.social.whatsapp` stays a bare, canonical URL - it's also what feeds
 * the JSON-LD `sameAs` list in `components/structured-data.tsx`, where a
 * query string would read as a less "official" entity link. The prefilled
 * starting message is appended separately, only where a visitor actually
 * clicks through to chat.
 */
export function whatsAppHref(message?: string) {
  if (!message) return site.social.whatsapp;
  return `${site.social.whatsapp}?text=${encodeURIComponent(message)}`;
}
