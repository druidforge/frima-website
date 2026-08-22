import type { Locale } from "@/i18n/routing";

/**
 * Each service carries its own slug per locale so every market gets a keyword
 * URL in its own language rather than an English slug under a translated path.
 *
 * `seed` and `hue` drive the chromatophore canvas: same system, different DNA
 * per arm, so no two service pages animate identically.
 */
export type Service = {
  id: string;
  slug: Record<Locale, string>;
  seed: number;
  /** Hue offsets in degrees applied to the brand cyan -> violet ramp. */
  hue: [number, number];
  from: string;
  timeline: string;
  /** Unit `timeline` is measured in - defaults to weeks when omitted. */
  timelineUnit?: "days" | "weeks";
  /**
   * Cover image for the services showcase, stored in `public/services/`.
   *
   * Masters are AVIF, resized to fit 2000px - far larger than any panel needs,
   * but enough headroom for `next/image` to derive every responsive size from.
   * Left unset, a panel falls back to this service's own chromatophore field,
   * so the page still renders without any photography.
   */
  image?: string;
};

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
    timeline: "2–4",
    image: "/services/website-design.avif",
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
    timeline: "4–6",
    image: "/services/web-applications.avif",
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
    timeline: "6–8",
    image: "/services/mobile-applications.avif",
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
    from: "300 €",
    timeline: "1–2",
    image: "/services/wedding-invitation.avif",
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
    image: "/services/business-card.avif",
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
    image: "/services/flyer-design.avif",
  },
];

export function getServiceBySlug(slug: string, locale: Locale) {
  return services.find((service) => service.slug[locale] === slug);
}
