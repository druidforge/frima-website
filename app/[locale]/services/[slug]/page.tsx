import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { ServiceBreadcrumbSchema } from "@/components/breadcrumb-schema";
import { CtaBand } from "@/components/cta-band";
import { OtherServicesCarousel } from "@/components/other-services-carousel";
import { Stagger, StaggerItem } from "@/components/interactions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Reveal } from "@/components/motion-primitives";
import { PageHeader } from "@/components/page-header";
import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { ServiceTiers } from "@/components/service-tiers";
import {
  entryPricing,
  getServiceBySlug,
  services,
  type Service,
} from "@/lib/services";
import { absoluteUrl, ogLocale } from "@/lib/metadata";

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.slug[locale] })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = getServiceBySlug(slug, locale);
  if (!service) return {};

  const t = await getTranslations({ locale, namespace: "services.items" });

  // Slugs differ per locale, so alternates must be built from this service's
  // own slug map rather than by reusing the current one across languages.
  const languages: Record<string, string> = {};
  for (const alt of locales) {
    languages[alt] = absoluteUrl(
      getPathname({
        href: {
          pathname: "/services/[slug]",
          params: { slug: service.slug[alt] },
        },
        locale: alt,
      }),
    );
  }
  languages["x-default"] = languages.hr;

  const title = t(`${service.id}.name`);
  // A dedicated, budget-checked field - `.description` also does duty as this
  // page's own visible lead paragraph, where a good meta description and a
  // good lead paragraph want different lengths.
  const description = t(`${service.id}.metaDescription`);

  return {
    title,
    description,
    alternates: { canonical: languages[locale], languages },
    openGraph: {
      type: "article",
      title,
      description,
      url: languages[locale],
      siteName: "Druid Forge",
      // Every other page gets this from `buildMetadata()`. This page can't
      // call that directly - its alternates need a different slug per
      // locale, which `buildAlternates` doesn't support - so it's set here
      // by hand instead of silently going without.
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = getServiceBySlug(slug, locale);
  if (!service) notFound();

  return (
    <>
      <ServiceBreadcrumbSchema
        locale={locale}
        serviceId={service.id}
        slug={slug}
      />
      <ServiceBody serviceId={service.id} locale={locale} />
      <ServiceCta />
    </>
  );
}

function ServiceBody({
  serviceId,
  locale,
}: {
  serviceId: string;
  locale: Locale;
}) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const service = services.find((s) => s.id === serviceId)!;
  const others = services.filter((s) => s.id !== serviceId);

  return (
    <>
      <PageHeader
        eyebrow={t("indexTitle")}
        title={ti(`${serviceId}.name`)}
        lead={ti(`${serviceId}.short`)}
        seed={service.seed}
        hue={service.hue}
      >
        <Reveal delay={0.2}>
          {/* Price and timeline used to sit here too. They now live beside the
              description further down, so the header states the service once
              rather than repeating its figures twice on one page.

              Slug changes per language, so this page needs a switcher that
              knows its own translated slugs. */}
          <LocaleSwitcher slugs={service.slug} className="mt-8 -ml-1.5" />
        </Reveal>
      </PageHeader>

      {/* Opens the page: the figures and the paragraph state what this is
          and what it costs before the spec sheet elaborates. */}
      {service.tiers ? (
        /* A tiered service prices the same page two ways, so the figures and
           the inclusion list belong to whichever tier is selected rather than
           to the page. One section covers what the two stacked ones do below:
           the lead, the choice, and the answer for the chosen option. */
        <section className="pt-12 pb-24 md:pb-32">
          <div className="shell">
            <Reveal>
              <ServiceTiers
                serviceId={serviceId}
                tiers={service.tiers}
                image={service.image}
                lead={ti(`${serviceId}.description`)}
              />
            </Reveal>
          </div>
        </section>
      ) : (
        <>
          <ServiceStats service={service} />
          <ServiceIncluded service={service} />
        </>
      )}

      <section className="pb-24 md:pb-32">
        <div className="shell">
          <h2 className="eyebrow">{t("otherTitle")}</h2>
          {/* Carousel on mobile, grid from sm - and one list either way, so
              the cards are not duplicated per viewport. The previous markup
              also wrapped each <li> in a <Reveal>, which put a <div> between
              the <ul> and its items; that is invalid and is gone with it. */}
          <div className="mt-8">
            <OtherServicesCarousel services={others} locale={locale} />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Price, timeline and any recurring figures for a service sold one way.
 *
 * Tiered services state their figures per tier instead - see `ServiceTiers`.
 */
function ServiceStats({ service }: { service: Service }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const pricing = entryPricing(service);

  return (
    <section className="pt-12 pb-12 md:pb-16">
      <div className="shell">
        {/* The left column held only a label and a lot of empty space. The
            price and timeline fill it instead - stacked rather than side by
            side, so the pair reads as one block against the prose. */}
        <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">{t("indexTitle")}</p>
            {/* Two columns rather than one stack of three: what the build
                costs and how long it takes belong together on the left, and
                the recurring figure reads as a separate commitment on the
                right. Services with no `monthly` keep the left column only. */}
            <dl className="mt-6 grid grid-cols-2 items-start gap-x-8 gap-y-6">
              <div className="col-start-1 row-start-1">
                <dt className="font-mono text-xs text-ink-faint">
                  {t("fromLabel")}
                </dt>
                <dd className="mt-1 text-(length:--text-step-1)">
                  {pricing.from}
                </dd>
              </div>
              <div className="col-start-1 row-start-2">
                <dt className="font-mono text-xs text-ink-faint">
                  {t("timelineLabel")}
                </dt>
                <dd className="mt-1 text-(length:--text-step-1)">
                  {pricing.timeline}{" "}
                  {pricing.timelineUnit === "days"
                    ? t("daysSuffix")
                    : t("weeksSuffix")}
                </dd>
              </div>
              {service.monthly ? (
                <div className="col-start-2 row-start-1">
                  <dt className="font-mono text-xs text-ink-faint">
                    {t("monthlyLabel")}
                  </dt>
                  <dd className="mt-1 text-(length:--text-step-1)">
                    {t("fromLabel")} {service.monthly}
                    {t("monthlySuffix")}
                  </dd>
                </div>
              ) : null}
              {/* Paid by the client to the platform, not to us - stated so
                  the yearly cost is visible before anyone commits, and sat
                  under `monthly` because both are money after launch. */}
              {service.storeFee ? (
                <div className="col-start-2 row-start-2">
                  <dt className="font-mono text-xs text-ink-faint">
                    {t("storeFeeLabel")}
                  </dt>
                  <dd className="mt-1 text-(length:--text-step-1)">
                    {service.storeFee}
                    {t("storeFeeSuffix")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-[58ch] text-(length:--text-step-1) leading-[1.6] text-ink-soft">
              {ti(`${service.id}.description`)}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** The spec sheet, beside the photograph, for a service sold one way. */
function ServiceIncluded({ service }: { service: Service }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const included = ti.raw(`${service.id}.included`) as string[];

  return (
    <section className="pb-20 md:pb-28">
      <div className="shell grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Image kept to a column rather than spanning the page: it sits
            beside the spec list instead of pushing it below the fold, and
            sticks while the longer list scrolls past. */}
        {service.image ? (
          <Reveal>
            {/* `sticky` and `relative` are the same CSS property - split
                across two elements so the sticking wrapper doesn't clobber
                the `<Image fill>` positioning root it wraps. */}
            <div className="lg:sticky lg:top-28">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-abyss-deep">
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        ) : null}

        <div>
          <h2 className="eyebrow">{t("includedTitle")}</h2>
          {/* Rows with hairline rules rather than a boxed column: it reads as
              a spec sheet and carries no implied order - these are parallel
              inclusions, not steps. */}
          <Stagger as="ul" step={0.06} className="mt-6">
            {included.map((item) => (
              <StaggerItem
                key={item}
                as="li"
                y={10}
                className="group flex items-start gap-4 border-b border-border py-4 transition-colors duration-(--dur-base) last:border-0 hover:text-ink"
              >
                <Check
                  size={16}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-violet transition-[transform] duration-(--dur-base) ease-out-quint [transform:scale(1)] group-hover:[transform:scale(1.15)]"
                />
                <span className="leading-relaxed text-ink-soft transition-colors duration-(--dur-base) group-hover:text-ink">
                  {item}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function ServiceCta() {
  const t = useTranslations("services");
  return <CtaBand title={t("ctaTitle")} body={t("ctaBody")} />;
}
