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
    instagram: "https://instagram.com/druidforge",
    linkedin: "https://www.linkedin.com/company/druid-forge",
    github: "https://github.com/druid-forge",
  },
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://druidforge.hr";
