/**
 * Single source of truth for business facts that appear in metadata, JSON-LD,
 * the footer, and the legal pages. `email` and `phone` are real; the rest are
 * still mock data pending real input.
 */
export const site = {
  name: "Druid Forge",
  legalName: "Druid Forge j.d.o.o.",
  oib: "12345678901", // mock Croatian tax number
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
