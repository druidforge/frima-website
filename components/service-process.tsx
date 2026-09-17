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
 * Laid out as a four-across band rather than in the page's usual label-left,
 * content-right split. That split works where the left column carries
 * something (the price block, the photograph), and this section has nothing to
 * put there - it left a third of the width empty next to one line of eyebrow
 * text, which read as a gap rather than as breathing room. Four columns spend
 * the width on the steps themselves, and shorten each measure to roughly
 * thirty characters, which is what makes a sequence scannable instead of four
 * paragraphs stacked in a corner.
 *
 * The homepage has a process section too (`components/home/process.tsx`), and
 * this is not it. That one draws a scroll-linked spine with GSAP, the single
 * heaviest dependency on the site, loaded behind an IntersectionObserver. Six
 * service pages do not each need to pay for that, so this renders with the
 * `Stagger` primitive already on the page.
 */
export function ServiceProcess({ serviceId }: { serviceId: string }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const steps = ti.raw(`${serviceId}.process`) as Step[];

  return (
    <section className="pb-20 md:pb-28">
      <div className="shell">
        <Reveal>
          <h2 className="eyebrow">{t("processTitle")}</h2>
        </Reveal>

        {/* `gap-px` over a `bg-border` parent draws the dividers: one hairline
            between cells, never a doubled 2px seam where two borders meet, and
            it collapses to horizontal rules by itself when the grid wraps to
            one column. */}
        <Stagger
          as="ol"
          step={0.07}
          className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <StaggerItem
              key={step.title}
              as="li"
              y={12}
              className="group bg-background p-6 transition-colors duration-(--dur-base) hover:bg-abyss-deep/2 sm:p-7"
            >
              <span className="font-mono text-xs text-violet">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-(length:--text-step-1) font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
