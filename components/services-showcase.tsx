"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  AppWindow,
  ArrowUpRight,
  FileText,
  Globe,
  Heart,
  IdCard,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
import { useLoopCarousel } from "@/lib/use-carousel";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  websites: Globe,
  webApps: AppWindow,
  mobileApps: Smartphone,
  weddingInvites: Heart,
  businessCards: IdCard,
  flyers: FileText,
};

/**
 * Services showcase: expanding panels on desktop, looping carousel on mobile.
 *
 * The two layouts share one list rather than rendering twice and hiding one -
 * duplicating six cards would double the DOM and the image elements on every
 * viewport. `md:` classes switch the same `<ul>` between a grid of panels and a
 * horizontal snap track.
 *
 * Notes on the pieces that are easy to get wrong:
 *
 * 1. **Panels are links, not divs with onClick.** These are navigations, so
 *    anchors are what give keyboard access, focus order, middle-click and
 *    "open in new tab" for free.
 * 2. **The accordion is desktop only.** A collapsed panel shows nothing but a
 *    rotated title and relies on hover to preview it. Touch has no hover, hence
 *    the carousel below `md`.
 * 3. **Looping is done with clones, added only after hydration on mobile.** The
 *    server sends the six real cards, so the carousel works immediately and
 *    nothing shifts; the clones then make it seamless in both directions. They
 *    reuse the same image URLs, so they cost DOM nodes but no extra requests.
 */
export function ServicesShowcase({ locale }: { locale: Locale }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");

  const count = services.length;
  const {
    trackRef,
    active,
    setActive,
    isCompact,
    loop,
    goTo,
    expand,
    isClone,
  } = useLoopCarousel(count);
  const items = expand(services);

  const columns = services
    .map((_, index) => (index === active ? "5fr" : "1fr"))
    .join(" ");

  return (
    <div>
      <ul
        ref={trackRef}
        style={{ "--cols": columns } as React.CSSProperties}
        className={cn(
          // Mobile: a snap track. The scrollbar is hidden because the peeking
          // next card already signals that this scrolls. `overscroll-x-contain`
          // keeps a fling that runs out of track from chaining onwards - to the
          // page, or to the browser's back gesture.
          "flex snap-x snap-mandatory overscroll-x-contain gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Desktop: back to the expanding grid.
          "md:grid md:h-[34rem] md:snap-none md:grid-flow-col md:overflow-visible md:pb-0",
          "md:[grid-template-columns:var(--cols)]",
          "md:transition-[grid-template-columns] md:duration-700 md:ease-out-quint",
        )}
      >
        {items.map((service, index) => {
          const Icon = icons[service.id];
          const real = loop ? index % count : index;
          const clone = isClone(index);
          const isActive = !isCompact && real === active;

          return (
            <li
              key={`${service.id}-${index}`}
              aria-hidden={clone || undefined}
              /**
               * `snap-always` caps a fling at one card. Without it a hard swipe
               * coasts over several snap points at once, which reads as a
               * runaway on a six-card list and can outrun the loop's buffer
               * before the wrap has anything still enough to correct.
               */
              className="w-[82%] shrink-0 snap-center snap-always sm:w-[62%] md:w-auto md:min-h-0 md:min-w-0 md:shrink"
            >
              <Link
                href={{
                  pathname: "/services/[slug]",
                  params: { slug: service.slug[locale] },
                }}
                tabIndex={clone ? -1 : undefined}
                onMouseEnter={() => setActive(real)}
                onFocus={() => setActive(real)}
                data-active={isActive || undefined}
                className="group relative flex h-full min-h-[20rem] flex-col justify-end overflow-hidden rounded-md border border-border bg-abyss-deep p-6 md:min-h-[19rem] md:min-w-[5rem]"
              >
                {service.image ? (
                  /**
                   * Two `sizes` cases in one string: a carousel card is ~82vw on
                   * a phone, while an expanded desktop panel is 5fr of 10 (~50vw,
                   * capped by the 88rem shell).
                   *
                   * The grayscale-until-active treatment is `md:` only. On mobile
                   * every card is equally "open", so desaturating all but one
                   * would just look broken.
                   */
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(max-width: 767px) 82vw, 55vw"
                    className="object-cover transition-[transform,filter] duration-700 ease-out-quint md:[filter:grayscale(1)] md:[transform:scale(1.05)] md:group-data-[active]:[filter:grayscale(0)] md:group-data-[active]:[transform:scale(1)]"
                  />
                ) : (
                  <ChromatophoreField
                    seed={service.seed}
                    hue={service.hue}
                    spacing={22}
                    intensity={0.9}
                    interactive={false}
                  />
                )}

                {/* Ink wash from the base so the copy stays readable over
                    whatever is underneath it. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-t from-abyss-deep via-abyss-deep/70 to-abyss-deep/10 transition-opacity duration-700 group-data-[active]:from-abyss-deep/95 group-data-[active]:via-abyss-deep/55"
                />

                {/* Collapsed state, desktop only: the title turned on its side.
                    `writing-mode` keeps it a real text run rather than a
                    transformed block. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper/70 opacity-100 transition-opacity duration-300 [writing-mode:vertical-rl] group-data-[active]:opacity-0 md:block"
                  style={{ transform: "translateX(-50%) rotate(180deg)" }}
                >
                  {ti(`${service.id}.name`)}
                </span>

                <div
                  className={cn(
                    "relative flex flex-col gap-3 transition-opacity duration-500 ease-out-quint",
                    // Every carousel card is open; only desktop panels hide copy.
                    "md:opacity-0 md:group-data-[active]:opacity-100",
                  )}
                >
                  {Icon ? (
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="text-violet md:delay-75"
                    />
                  ) : null}

                  <h2 className="font-display text-(length:--text-step-2) font-semibold tracking-tight text-paper">
                    {ti(`${service.id}.name`)}
                  </h2>

                  <p className="max-w-[38ch] text-sm leading-relaxed text-paper/75">
                    {ti(`${service.id}.short`)}
                  </p>

                  <div className="mt-2 flex items-end justify-between gap-6">
                    <dl className="flex gap-7 font-mono text-xs text-paper/60">
                      <div>
                        <dt>{t("fromLabel")}</dt>
                        <dd className="mt-1 font-sans text-sm text-paper">
                          {service.from}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("timelineLabel")}</dt>
                        <dd className="mt-1 font-sans text-sm text-paper">
                          {service.timeline}{" "}
                          {service.timelineUnit === "days"
                            ? t("daysSuffix")
                            : t("weeksSuffix")}
                        </dd>
                      </div>
                    </dl>
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper transition-[background-color,border-color,color,transform] duration-(--dur-base) ease-out-quint group-hover:[transform:scale(1.1)] group-hover:border-paper group-hover:bg-paper group-hover:text-ink"
                    >
                      <ArrowUpRight size={16} className="arrow-travel" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Position indicator, mobile only. Every card is already a link, so these
          are a shortcut rather than the only way through - which is why they can
          stay small. */}
      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {services.map((service, index) => (
          <button
            key={service.id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={ti(`${service.id}.name`)}
            aria-current={index === active ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-(--dur-base) ease-out-quint",
              index === active ? "w-6 bg-ink" : "w-1.5 bg-ink/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}
