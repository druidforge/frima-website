import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { CtaBand } from "@/components/cta-band";
import { ScrollStagger, ScrollStaggerItem } from "@/components/interactions";
import { LogoDraw } from "@/components/logo-draw";
import { Parallax, Reveal, RevealWords } from "@/components/motion-primitives";
import { PageHeader } from "@/components/page-header";
import { TeamShowcase } from "@/components/team-showcase";
import { locales, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { team } from "@/lib/team";

const values = ["direct", "own", "plain"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.about" });

  return buildMetadata({
    title: t("title"),
    description: t("description"),
    href: "/about",
    locale,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AboutHeader />
      <AboutStory />
      <AboutTeam />
      <AboutValues />
      <AboutLocation />
      <AboutCta />
    </>
  );
}

function AboutHeader() {
  const t = useTranslations("about");
  const tn = useTranslations("nav");
  return (
    <PageHeader
      eyebrow={tn("about")}
      title={t("title")}
      lead={t("lead")}
      seed={71}
      hue={[22, -8]}
    />
  );
}

/** The story section is where the name stops being decoration and becomes the
    actual argument for how the studio is organised. */
function AboutStory() {
  const t = useTranslations("about");

  return (
    <section className="on-abyss relative overflow-clip py-20 md:py-28">
      <div className="shell relative z-10 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="eyebrow">{t("storyTitle")}</p>
          {/* Same spot the silhouette used to resolve in, but the mark
              itself now - drawn once on arrival, not found by hovering. */}
          <LogoDraw className="mt-10" />
        </div>
        <Parallax distance={26}>
          <RevealWords
            text={t("storyTitle")}
            as="h2"
            className="font-display text-(length:--text-step-3) font-semibold"
          />
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-[58ch] text-(length:--text-step-1) leading-[1.6] text-muted-foreground">
              {t("storyBody")}
            </p>
          </Reveal>
        </Parallax>
      </div>
    </section>
  );
}

/**
 * The two people, not the studio's abstraction of them.
 *
 * Deliberately its own section rather than a line in the story above - a
 * name in a sentence is not the same as a face. `TeamShowcase` is a small
 * switcher rather than a grid or a stack of rows: at exactly two people,
 * that is the whole roster, so one photo shown at a time with an arrow to
 * step to the other reads as an introduction rather than a directory.
 */
function AboutTeam() {
  const t = useTranslations("about");

  const people = team.map((person) => ({
    name: t(`team.${person.id}.name`),
    role: t(`team.${person.id}.role`),
    bio: t(`team.${person.id}.bio`),
    photo: person.photo,
  }));

  return (
    <section className="overflow-clip py-20 md:py-28">
      <div className="shell">
        <p className="eyebrow">{t("teamTitle")}</p>
        <RevealWords
          text={t("teamTitle")}
          as="h2"
          className="mt-5 max-w-[18ch] font-display text-(length:--text-step-3) font-semibold"
        />
      </div>

      <div className="shell mt-20 md:mt-28">
        <TeamShowcase
          people={people}
          prevLabel={t("teamPrev")}
          nextLabel={t("teamNext")}
        />
      </div>
    </section>
  );
}

function AboutValues() {
  const t = useTranslations("about");

  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <p className="eyebrow">{t("valuesTitle")}</p>
        <ScrollStagger
          as="ul"
          className="mt-12 grid gap-px overflow-clip rounded-md border border-border bg-border md:grid-cols-3"
        >
          {values.map((value, index) => (
            <ScrollStaggerItem
              key={value}
              as="li"
              index={index}
              total={values.length}
              className="group relative bg-background p-8 transition-colors duration-(--dur-slow) hover:bg-paper md:p-9"
            >
              {/* Top hairline draws in per cell, so hovering the grid reads as
                  lighting up one arm at a time. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linear-to-r from-cyan to-violet transition-transform duration-(--dur-slow) ease-out-quint group-hover:scale-x-100"
              />
              <h3 className="font-display text-(length:--text-step-1) font-semibold tracking-tight transition-transform duration-(--dur-base) ease-out-quint group-hover:translate-x-1">
                {t(`values.${value}Title`)}
              </h3>
              <p className="mt-3.5 text-ink-soft">{t(`values.${value}Body`)}</p>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

function AboutLocation() {
  const t = useTranslations("about");

  return (
    <section className="pb-20 md:pb-28">
      <div className="shell grid gap-10 border-t border-border pt-14 md:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <p className="eyebrow">{t("locationTitle")}</p>
        <div>
          <Reveal>
            <p className="max-w-[54ch] text-(length:--text-step-1) leading-[1.55] text-ink-soft">
              {t("locationBody")}
            </p>
            <p className="mt-7 inline-flex items-center gap-2.5 font-mono text-sm text-ink-faint">
              <MapPin size={15} aria-hidden="true" />
              {site.address.street}, {site.address.postalCode}{" "}
              {site.address.city}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AboutCta() {
  const t = useTranslations("about");
  return <CtaBand title={t("ctaTitle")} body={t("ctaBody")} />;
}
