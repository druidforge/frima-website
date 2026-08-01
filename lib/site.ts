/**
 * Single source of truth for business facts that appear in metadata, JSON-LD,
 * the footer, and the legal pages. All values are mock data pending real input.
 */
export const site = {
  name: "OKTOPOD",
  legalName: "Oktopod studio j.d.o.o.",
  oib: "12345678901", // mock Croatian tax number
  email: "hello@oktopod.studio",
  phone: "+385 91 234 5678",
  address: {
    street: "Ulica slobode 12",
    city: "Split",
    postalCode: "21000",
    country: "HR",
    countryName: "Hrvatska",
  },
  geo: { lat: 43.5081, lng: 16.4402 },
  founded: "2019",
  social: {
    instagram: "https://instagram.com/oktopod.studio",
    linkedin: "https://www.linkedin.com/company/oktopod-studio",
    github: "https://github.com/oktopod-studio",
  },
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://oktopod.studio";
