"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Reveal, RevealWords } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { services } from "@/lib/services";

/**
 * The six arms.
 *
 * Cards stick as they reach the top and the next one slides over, so the
 * section reads as one continuous movement rather than six separate reveals.
 * No 01/02/03 markers here on purpose - these are parallel offerings, not a
 * sequence, and numbering them would encode an order that does not exist.
 */
export function ServicesStack() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;

  return (
    <section className="relative py-28 md:py-36">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow">{t("servicesTitle")}</p>
            <RevealWords
              text={t("servicesLead")}
              as="h2"
              className="mt-5 max-w-[22ch] font-display text-(length:--text-step-3) font-semibold"
            />
          </div>
          <Reveal>
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-sm font-medium transition-colors duration-(--dur-base) hover:border-ink"
            >
              {t("servicesCta")}
              <ArrowUpRight size={15} className="arrow-travel" />
            </Link>
          </Reveal>
        </div>

        <ul className="mt-16 pb-28 md:pb-0">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              locale={locale}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  locale,
}: {
  service: (typeof services)[number];
  index: number;
  locale: Locale;
}) {
  const ts = useTranslations("services");
  const ti = useTranslations("services.items");

  /**
   * The card's field is invisible until hover, so it should not be animating
   * until then either.
   *
   * Six of these sit on the homepage, each running its own requestAnimationFrame
   * loop over several hundred cells for as long as it was on screen - all of it
   * painting under `opacity-0`, where nobody could see any of it. Tracking hover
   * in state costs one re-render of one card and lets the loop stay stopped.
   */
  const [hovered, setHovered] = useState(false);

  return (
    <li
      /**
       * A sticky sibling releases when the list's bottom edge rises to
       * `stickTop + its own height`. For the stack to peel in order,
       * that sum has to grow down the list - `stickTop` does, by
       * 1.1rem a card, so the heights must not vary by more than that.
       *
       * On mobile they did: the wedding-invitations card wraps both its
       * title and its description, making it tall enough that its sum
       * overtook the cards below it, so it slid away first and out of
       * sequence.
       *
       * Two things keep that from recurring. The card carries a `min-h`
       * on mobile, which removes most of the variance; and the mobile
       * offset is widened to 1.75rem, so the ordering survives up to
       * 28px of difference rather than 17px - useful headroom, since
       * the Croatian and German titles wrap differently from English.
       * The wider gap also makes each card in the stack actually
       * visible on a narrow screen instead of a hairline.
       *
       * The index rides in as a custom property so the step can differ
       * per breakpoint; an inline `top` could not be responsive, and it
       * was printing float noise like `3.3000000000000003rem`.
       */
      className="sticky top-[calc(6rem+var(--i)*1.75rem)] md:top-[calc(6rem+var(--i)*1.1rem)]"
      style={{ "--i": index } as React.CSSProperties}
    >
      <Link
        href={{
          pathname: "/services/[slug]",
          params: { slug: service.slug[locale] },
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        // Keyboard reaches these too, and the field is part of what the
        // card looks like when it is the active one.
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="card-lift group relative mb-4 flex min-h-[17rem] flex-col justify-between gap-6 overflow-clip rounded-md border border-border bg-paper p-7 hover:border-ink/35 md:min-h-0 md:flex-row md:items-center md:gap-10 md:p-9"
      >
        {/* Each arm carries its own DNA: seed and hue shift per service. */}
        <ChromatophoreField
          seed={service.seed}
          hue={service.hue}
          spacing={26}
          intensity={0.5}
          interactive={false}
          active={hovered}
          className="opacity-0 transition-opacity duration-(--dur-glacial) ease-out-quint group-hover:opacity-100"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-paper/70 opacity-0 transition-opacity duration-(--dur-glacial) group-hover:opacity-100"
        />

        {/* Hairline that draws across the card's top edge on hover. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linear-to-r from-cyan to-violet transition-transform duration-(--dur-slow) ease-out-quint group-hover:scale-x-100"
        />

        <div className="relative z-10 flex-1">
          <h3 className="font-display text-(length:--text-step-2) font-semibold tracking-tight transition-transform duration-(--dur-base) ease-out-quint group-hover:translate-x-1">
            {ti(`${service.id}.name`)}
          </h3>
          <p className="mt-2.5 max-w-[46ch] text-ink-soft transition-transform duration-(--dur-slow) ease-out-quint group-hover:translate-x-1">
            {ti(`${service.id}.short`)}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-8">
          <dl className="flex gap-8 font-mono text-xs">
            <div>
              <dt className="text-ink-faint">{ts("fromLabel")}</dt>
              <dd className="mt-1 text-sm">{service.from}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">{ts("timelineLabel")}</dt>
              <dd className="mt-1 text-sm">
                {service.timeline} {ts("weeksSuffix")}
              </dd>
            </div>
          </dl>
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full border border-ink/20 transition-[background-color,border-color,color,transform] duration-(--dur-base) ease-out-quint group-hover:[transform:scale(1.1)] group-hover:border-ink group-hover:bg-ink group-hover:text-paper"
          >
            <ArrowUpRight size={17} className="arrow-travel" />
          </span>
        </div>
      </Link>
    </li>
  );
}
