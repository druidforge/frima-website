import type { Locale } from "@/i18n/routing";

/**
 * What a job costs and how long it runs.
 *
 * Held apart from `Service` because a service can quote one set of these or
 * several - see `tiers`.
 */
export type Pricing = {
  from: string;
  timeline: string;
  /** Unit `timeline` is measured in - defaults to weeks when omitted. */
  timelineUnit?: "days" | "weeks";
};

/**
 * One named way to buy a service, with its own price and timeline.
 *
 * Copy lives in `services.items.<service>.tiers.<tier>` - name, description
 * and its own `included` list, so a tier states what it covers rather than
 * inheriting a list written for a different price.
 */
export type ServiceTier = Pricing & { id: string };

/**
 * Each service carries its own slug per locale so every market gets a keyword
 * URL in its own language rather than an English slug under a translated path.
 *
 * `seed` and `hue` drive the chromatophore canvas: same system, different DNA
 * per arm, so no two service pages animate identically.
 */
type ServiceBase = {
  id: string;
  slug: Record<Locale, string>;
  seed: number;
  /** Hue offsets in degrees applied to the brand cyan -> violet ramp. */
  hue: [number, number];
  /**
   * Recurring cost after launch, shown as a third figure beside `from` and
   * `timeline`. Left unset, the stats block renders two entries as before -
   * a service only advertises upkeep once we know what to charge for it.
   */
  monthly?: string;
  /**
   * Yearly charge for publishing the app and keeping the store account it
   * lives under. Billed by us, not by the platform - one developer account
   * covers every app we ship, so this is a service line rather than a
   * pass-through of Apple's fee, and the label on the page says so.
   */
  storeFee?: string;
  /**
   * Cover image for the services showcase, stored in `public/services/`.
   *
   * Masters are AVIF at 2000px on the long edge - far larger than any panel
   * needs, but enough headroom for `next/image` to derive every responsive
   * size from. Built by `npm run build:service-images`; do not hand-edit these
   * paths or the files they name.
   *
   * The hash in each filename is the hash of the file's own bytes, and it is
   * what makes the year-long `immutable` header in `next.config.ts` honest: a
   * reworked photograph lands on a new URL, so a returning visitor is never
   * left holding a cached copy of the old one.
   * Left unset, a panel falls back to this service's own chromatophore field,
   * so the page still renders without any photography.
   */
  image?: string;
};

/**
 * A service quotes its price one of two ways, never both: a single figure, or
 * a list of tiers the visitor picks between. The union is what keeps the two
 * from drifting - there is no second copy of the entry price to forget to
 * update, and reading `service.from` without going through `entryPricing()`
 * does not compile.
 */
export type Service = ServiceBase &
  (
    | (Pricing & { tiers?: undefined })
    | { tiers: readonly [ServiceTier, ...ServiceTier[]] }
  );

/**
 * The figures a card, a stat block or an OG image quotes for a service.
 *
 * For a tiered service that is the first tier - the cheapest way in, which is
 * what "from" means. Order `tiers` accordingly.
 */
export function entryPricing(service: Service): Pricing {
  return service.tiers ? service.tiers[0] : service;
}

export const services: Service[] = [
  {
    id: "websites",
    slug: {
      hr: "izrada-web-stranica",
      en: "website-design",
      de: "webseiten-erstellung",
    },
    seed: 17,
    hue: [0, 0],
    from: "700 €",
    monthly: "20 €",
    timeline: "2–4",
    image: "/services/website-design.94e5f3ea.avif",
  },
  {
    id: "webApps",
    slug: {
      hr: "web-aplikacije",
      en: "web-applications",
      de: "web-anwendungen",
    },
    seed: 43,
    hue: [-18, 12],
    from: "2.500 €",
    monthly: "30 €",
    timeline: "4–6",
    image: "/services/web-applications.c639c491.avif",
  },
  {
    id: "mobileApps",
    slug: {
      hr: "mobilne-aplikacije",
      en: "mobile-applications",
      de: "mobile-anwendungen",
    },
    seed: 71,
    hue: [24, -10],
    from: "4.000 €",
    monthly: "20 €",
    storeFee: "100 €",
    timeline: "6–8",
    image: "/services/mobile-applications.d4947919.avif",
  },
  {
    id: "weddingInvites",
    slug: {
      hr: "digitalne-pozivnice-za-vjencanje",
      en: "digital-wedding-invitations",
      de: "digitale-hochzeitseinladungen",
    },
    seed: 29,
    hue: [40, 28],
    /**
     * Template first: it is the cheaper way in, so it is the figure the cards
     * and the OG image quote as "from". Full custom is what we have always
     * sold; the template tier fills a page we have already built with your
     * text and photographs.
     */
    tiers: [
      { id: "template", from: "18 €", timeline: "2–3", timelineUnit: "days" },
      { id: "custom", from: "180 €", timeline: "1–2" },
    ],
    image: "/services/wedding-invitation.072066a3.avif",
  },
  {
    id: "businessCards",
    slug: {
      hr: "dizajn-vizitki",
      en: "business-card-design",
      de: "visitenkarten-design",
    },
    seed: 58,
    hue: [-32, -6],
    from: "70 €",
    timeline: "2–3",
    timelineUnit: "days",
    image: "/services/business-card.9831c261.avif",
  },
  {
    id: "flyers",
    slug: {
      hr: "dizajn-letaka",
      en: "flyer-design",
      de: "flyer-design",
    },
    seed: 92,
    hue: [12, 40],
    from: "80 €",
    timeline: "3–4",
    timelineUnit: "days",
    image: "/services/flyer-design.78e44cb7.avif",
  },
];

export function getServiceBySlug(slug: string, locale: Locale) {
  return services.find((service) => service.slug[locale] === slug);
}
