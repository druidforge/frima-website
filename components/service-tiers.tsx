"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Stagger, StaggerItem } from "@/components/interactions";
import type { ServiceTier } from "@/lib/services";
import { cn } from "@/lib/utils";

/**
 * The price block for a service sold in more than one way.
 *
 * Wedding invitations are the first: the same page, either filled into a
 * template we already built or drawn from scratch. Those are different jobs at
 * different prices, so the page cannot state one figure and one inclusion list
 * and stay honest - the visitor picks which job they are buying and the block
 * answers for that one.
 *
 * Tabs, not an accordion or two stacked columns:
 *
 * 1. **Tabs, because the tiers are alternatives.** You buy one. Showing both
 *    inclusion lists side by side invites a line-by-line diff of two lists that
 *    are mostly the same sentence, which reads as noise on a phone.
 * 2. **The price sits on the tab itself.** The choice is a price choice, so the
 *    figure has to be legible before the panel is opened - a tab labelled only
 *    with a name makes you click to find out what it costs.
 * 3. **Real tab semantics.** `role="tablist"` with roving focus and arrow keys,
 *    because that is what a screen reader and a keyboard expect from a control
 *    that swaps a panel underneath it.
 *
 * Copy for every tier lives under `services.items.<service>.tiers.<tier>`, so a
 * new tier is a data entry plus a message block, not a component change.
 */
export function ServiceTiers({
  serviceId,
  tiers,
  image,
  lead,
}: {
  serviceId: string;
  tiers: readonly ServiceTier[];
  image?: string;
  /** The service's own paragraph - what is true whichever tier you pick. */
  lead: string;
}) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tier = tiers[active];
  const base = `${serviceId}.tiers.${tier.id}`;
  const included = ti.raw(`${base}.included`) as string[];
  const panelImage = tier.image ?? image;

  const tabId = (index: number) => `tier-tab-${serviceId}-${tiers[index].id}`;
  const panelId = (index: number) => `tier-panel-${serviceId}-${tiers[index].id}`;

  /**
   * Arrow keys move selection and focus together, wrapping at both ends -
   * the automatic-activation pattern, which is the right one here because
   * switching panels costs nothing and fetches nothing.
   */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const last = tiers.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = active === last ? 0 : active + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = active === 0 ? last : active - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    }

    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <h2 className="eyebrow">{t("tiersTitle")}</h2>
      <p className="mt-5 max-w-[58ch] text-(length:--text-step-1) leading-[1.6] text-ink-soft">
        {lead}
      </p>

      <div
        role="tablist"
        aria-label={t("tiersTitle")}
        onKeyDown={onKeyDown}
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        {tiers.map((option, index) => {
          const selected = index === active;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              id={tabId(index)}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              aria-selected={selected}
              aria-controls={panelId(index)}
              // Roving tabindex: one stop for the whole group, arrow keys
              // move within it.
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "group relative overflow-hidden rounded-md border p-5 text-left transition-[border-color,background-color,color] duration-(--dur-base) ease-out-quint",
                // The unselected card is legible but visibly the option you
                // are not reading: same layout, softer ink.
                selected
                  ? "border-ink/45 bg-ink/[0.03] text-ink"
                  : "border-border text-ink-soft hover:border-ink/35 hover:text-ink",
              )}
            >
              {/* The same hairline the service cards use for hover, here
                  carrying the selected state instead. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 top-0 h-px origin-left bg-linear-to-r from-cyan to-violet transition-transform duration-(--dur-slow) ease-out-quint",
                  selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />

              <span className="block font-display text-(length:--text-step-1) font-semibold tracking-tight">
                {ti(`${serviceId}.tiers.${option.id}.name`)}
              </span>
              <span className="mt-1.5 block max-w-[34ch] text-sm leading-relaxed text-ink-soft">
                {ti(`${serviceId}.tiers.${option.id}.tagline`)}
              </span>

              {/* Spans rather than a `dl`: a button may only contain phrasing
                  content, so the definition list this mirrors elsewhere on the
                  page is not available inside one. */}
              <span className="mt-5 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs text-ink-faint">
                <span className="block">
                  <span className="block">{t("fromLabel")}</span>
                  <span className="mt-1 block font-sans text-(length:--text-step-1)">
                    {option.from}
                  </span>
                </span>
                <span className="block">
                  <span className="block">{t("timelineLabel")}</span>
                  <span className="mt-1 block font-sans text-(length:--text-step-1)">
                    {option.timeline}{" "}
                    {option.timelineUnit === "days"
                      ? t("daysSuffix")
                      : t("weeksSuffix")}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyed on the tier so the panel remounts on every switch: the CSS
          entrance replays, and the inclusion list staggers in again rather
          than swapping its text in place. */}
      <div
        key={tier.id}
        role="tabpanel"
        id={panelId(active)}
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="rise-fade mt-12 grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16"
      >
        {/* The figures are on the tabs, a few pixels above this, and are not
            repeated here - the selected tab is the price label for the panel.

            `sticky` and `relative` are the same CSS property, so the sticking
            wrapper is split from the `<Image fill>` positioning root it wraps
            rather than clobbering it. */}
        {/* A tier can show its own image - the template gallery for the
            template tier - and falls back to the service's photograph. The
            panel is keyed by tier, so switching tabs remounts it and the new
            image arrives with the same `rise-fade` as the copy beside it. */}
        {panelImage ? (
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-abyss-deep">
              <Image
                src={panelImage}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <div>
          <p className="max-w-[58ch] leading-relaxed text-ink-soft">
            {ti(`${base}.description`)}
          </p>

          <h3 className="eyebrow mt-10">{t("includedTitle")}</h3>
          {/* Rows with hairline rules rather than a boxed column: parallel
              inclusions, not steps. */}
          <Stagger as="ul" step={0.05} className="mt-6">
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

          {/* Whatever the price does not cover, said next to it rather than
              left for the first invoice. */}
          <p className="mt-6 border-l-2 border-violet/40 pl-4 text-sm leading-relaxed text-ink-soft">
            {ti(`${base}.note`)}
          </p>
        </div>
      </div>
    </div>
  );
}
