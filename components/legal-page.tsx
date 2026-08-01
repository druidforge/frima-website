import { getTranslations } from "next-intl/server";

import { LegalToc } from "@/components/legal-toc";
import { Reveal } from "@/components/motion-primitives";
import { PageHeader } from "@/components/page-header";

export type LegalSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

/**
 * Shared legal shell. A sticky table of contents matters here more than
 * anywhere else on the site: these are the pages people arrive at looking for
 * one specific clause, not to read top to bottom.
 */
export async function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  seed,
  hue,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  seed?: number;
  hue?: [number, number];
  children?: React.ReactNode;
}) {
  const t = await getTranslations("legal");

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        lead={intro}
        seed={seed}
        hue={hue}
      >
        <p className="mt-8 font-mono text-xs text-ink-faint">
          {t("lastUpdated")}: 2026-07-31
        </p>
      </PageHeader>

      {/* Same compensation as the other inner pages: pt-12 on top of the
          header's own pb-16 / md:pb-24 gives 7rem / 9rem, matching the space
          below. */}
      <section className="pt-12 pb-28 md:pb-36">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-20">
          <LegalToc
            label={t("tocTitle")}
            sections={sections.map(({ id, title }) => ({ id, title }))}
          />

          <div className="min-w-0 max-w-[68ch]">
            {sections.map((section) => (
              <Reveal key={section.id}>
                <article
                  id={section.id}
                  className="scroll-mt-28 border-b border-border py-9 first:pt-0 last:border-0"
                >
                  <h2 className="font-display text-(length:--text-step-2) font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  <div className="mt-4 leading-relaxed text-ink-soft">
                    {section.body}
                  </div>
                </article>
              </Reveal>
            ))}
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
