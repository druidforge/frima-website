import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion-primitives";
import { Stagger, StaggerItem } from "@/components/interactions";

type Entry = { q: string; a: string };

/**
 * The questions that actually get asked about one service, answered on the
 * page rather than in the first reply email.
 *
 * Left open rather than folded into an accordion. Google renders and indexes
 * collapsed content either way, so that is not the reason - the reason is that
 * this is the only long-form prose on the page, and hiding it behind six
 * summary rows would leave a visitor who scrolled this far with nothing to
 * read. Vertical space is the cheap resource here.
 *
 * `<dl>` rather than headings and paragraphs: these are term/definition pairs,
 * and the pairing is the whole structure. Each pair is wrapped in a `<div>`,
 * which is the one element HTML allows between a `<dl>` and its `<dt>`/`<dd>`.
 */
export function ServiceFaq({ serviceId }: { serviceId: string }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const entries = ti.raw(`${serviceId}.faq`) as Entry[];

  return (
    <section className="pb-24 md:pb-32">
      <div className="shell grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <h2 className="eyebrow">{t("faqTitle")}</h2>
        </Reveal>

        <Stagger as="dl" step={0.06}>
          {entries.map((entry) => (
            <StaggerItem
              key={entry.q}
              y={10}
              className="border-b border-border py-6 first:pt-0 last:border-0 last:pb-0"
            >
              <dt className="font-display text-(length:--text-step-1) font-semibold tracking-tight text-ink">
                {entry.q}
              </dt>
              {/* `ml-0` is not redundant - browsers give `dd` a 40px inline
                  start margin by default, which would step every answer in
                  from its own question. */}
              <dd className="mt-2 ml-0 max-w-[62ch] leading-relaxed text-ink-soft">
                {entry.a}
              </dd>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
