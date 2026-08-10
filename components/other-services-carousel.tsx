"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Service } from "@/lib/services";
import { useLoopCarousel } from "@/lib/use-carousel";
import { cn } from "@/lib/utils";

/**
 * The five sibling services at the foot of a service page.
 *
 * A looping snap carousel on mobile, the same grid as before from `sm` up -
 * one list either way, so the cards are never duplicated across viewports.
 * Scroll mechanics come from `useLoopCarousel`, shared with the services
 * showcase, so a fix to the wrapping reaches both.
 */
export function OtherServicesCarousel({
  services: others,
  locale,
}: {
  services: Service[];
  locale: Locale;
}) {
  const ti = useTranslations("services.items");
  const count = others.length;
  const { trackRef, active, loop, goTo, expand, isClone } =
    useLoopCarousel(count);
  const items = expand(others);

  return (
    <div>
      <ul
        ref={trackRef}
        className={cn(
          "flex snap-x snap-mandatory overscroll-x-contain gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3",
        )}
      >
        {items.map((other, index) => {
          const clone = isClone(index);

          return (
            <li
              key={`${other.id}-${index}`}
              aria-hidden={clone || undefined}
              // `snap-always` holds a hard swipe to one card - see the note on
              // the showcase track, which shares this hook.
              className="w-[78%] shrink-0 snap-center snap-always sm:w-auto sm:shrink"
            >
              <Link
                href={{
                  pathname: "/services/[slug]",
                  params: { slug: other.slug[locale] },
                }}
                tabIndex={clone ? -1 : undefined}
                className="card-lift group flex h-full flex-col overflow-hidden rounded-md border border-border bg-paper hover:border-ink/35"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-abyss-deep">
                  {other.image ? (
                    <Image
                      src={other.image}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 78vw, (max-width: 1023px) 45vw, 30vw"
                      className="object-cover transition-[transform,filter] duration-(--dur-glacial) ease-out-quint [filter:grayscale(1)] [transform:scale(1)] group-hover:[filter:grayscale(0)] group-hover:[transform:scale(1.05)]"
                    />
                  ) : (
                    <ChromatophoreField
                      seed={other.seed}
                      hue={other.hue}
                      spacing={26}
                      intensity={0.7}
                      interactive={false}
                    />
                  )}
                </span>
                <span className="flex flex-1 items-center justify-between gap-4 p-5">
                  <span className="font-display text-lg font-semibold tracking-tight transition-transform duration-(--dur-base) ease-out-quint group-hover:translate-x-1">
                    {ti(`${other.id}.name`)}
                  </span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="arrow-travel shrink-0 text-ink-faint transition-colors group-hover:text-ink"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Position indicator, mobile only. Each card is already a link, so these
          are a shortcut rather than the only way through. */}
      {loop ? (
        <div className="mt-5 flex justify-center gap-2 sm:hidden">
          {others.map((other, index) => (
            <button
              key={other.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={ti(`${other.id}.name`)}
              aria-current={index === active ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-(--dur-base) ease-out-quint",
                index === active ? "w-6 bg-ink" : "w-1.5 bg-ink/25",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
