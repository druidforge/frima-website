import { useTranslations } from "next-intl";

import { FaqAccordion, type FaqEntry } from "@/components/faq-accordion";
import { Reveal } from "@/components/motion-primitives";

/**
 * The questions that actually get asked about one service, answered on the
 * page rather than in the first reply email.
 *
 * Each set opens with the money question, phrased the way it gets typed into
 * Google ("Koliko košta izrada web stranice?"), because that is both the first
 * thing a client wants and the query the page has the best claim to.
 *
 * Stays a Server Component and hands the entries to the client accordion as
 * props. `services.items` is in the client namespace list in
 * `app/[locale]/layout.tsx`, so anything left inside it is serialised into the
 * HTML of every page on the site - reading the copy here keeps thirty
 * questions and answers per locale out of that payload, and the layout drops
 * them from `clientMessages` besides.
 */
export function ServiceFaq({ serviceId }: { serviceId: string }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const entries = ti.raw(`${serviceId}.faq`) as FaqEntry[];

  return (
    <section className="pb-24 md:pb-32">
      <div className="shell">
        <Reveal>
          <h2 className="eyebrow">{t("faqTitle")}</h2>
        </Reveal>
        <FaqAccordion entries={entries} />
      </div>
    </section>
  );
}
