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
  founded: "2019",
  social: {
    instagram: "https://instagram.com/druid.forge",
    whatsapp: "https://wa.me/385955617511",
    linkedin: "https://www.linkedin.com/company/druid-forge",
    github: "https://github.com/druid-forge",
  },
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://druid-forge.hr";

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
