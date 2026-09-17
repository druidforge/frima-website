import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion-primitives";
import { Stagger, StaggerItem } from "@/components/interactions";

type Step = { title: string; body: string };

/**
 * How a given service actually runs, start to finish.
 *
 * Deliberately per-service rather than one shared list: a numbered sequence
 * that would read the same on all six pages is exactly the templated filler
 * Google already has six copies of. The steps here name the things that only
 * happen on this job - a print handover, an App Store review, a data
 * migration - which is what makes the page worth crawling on its own.
 *
 * The homepage has a process section too (`components/home/process.tsx`), and
 * this is not it. That one draws a scroll-linked spine with GSAP, the single
 * heaviest dependency on the site, loaded behind an IntersectionObserver. Six
 * service pages do not each need to pay for that, so this renders the same
 * idea with the `Stagger` primitive already on the page.
 */
export function ServiceProcess({ serviceId }: { serviceId: string }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const steps = ti.raw(`${serviceId}.process`) as Step[];

  return (
    <section className="pb-20 md:pb-28">
      {/* Same column split as the stats and spec-sheet sections above, so the
          page keeps one rhythm rather than introducing a third grid. */}
      <div className="shell grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <h2 className="eyebrow">{t("processTitle")}</h2>
        </Reveal>

        <Stagger as="ol" step={0.08} className="relative">
          {/* One hairline behind the markers, ending at the last one rather
              than running past it into the gap below the section. */}
          <span
            aria-hidden="true"
            className="absolute left-[0.9rem] top-3 hidden h-[calc(100%-4.5rem)] w-px bg-border sm:block"
          />
          {steps.map((step, index) => (
            <StaggerItem
              key={step.title}
              as="li"
              y={12}
              className="relative pb-12 last:pb-0 sm:pl-14"
            >
              <span
                aria-hidden="true"
                className="mb-3 flex size-[1.85rem] items-center justify-center rounded-full border border-border bg-background font-mono text-[0.7rem] text-ink-faint sm:absolute sm:left-0 sm:top-0 sm:mb-0"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-(length:--text-step-1) font-semibold tracking-tight">
                {step.title}
              </h3>
              {/* Measure capped well under the column width: the point of the
                  extra copy is that it stays readable, not that it fills. */}
              <p className="mt-2 max-w-[56ch] leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
