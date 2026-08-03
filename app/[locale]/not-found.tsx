import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Reveal, RevealWords } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

/**
 * 404 inside a locale.
 *
 * The forge carries the joke and the apology at once: metal that will not hold
 * its shape simply goes back in the fire, so a missing page reads as part of the
 * craft rather than as a failure notice. The mark resolves out of the field here
 * as it does on the homepage, which also quietly signals "still the right site".
 */
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-clip pt-[4.5rem]">
      <ChromatophoreField
        seed={404}
        silhouette
        markX={0.7}
        markScale={0.5}
        spacing={17}
        intensity={0.9}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_28%_45%,var(--color-paper)_18%,transparent_78%)]"
      />

      <div className="shell relative z-10 flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow">{t("eyebrow")}</p>

        <RevealWords
          text={t("title")}
          as="h1"
          className="mt-5 max-w-[16ch] font-display text-[clamp(2.2rem,min(6vw,9svh),5rem)] font-bold tracking-[-0.04em]"
        />

        <Reveal delay={0.1}>
          <p className="mt-7 max-w-[58ch] text-(length:--text-step-1) leading-[1.55] text-ink-soft">
            {t("body")}
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="btn-ink group inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3.5 font-medium text-paper"
            >
              {t("home")}
              <ArrowUpRight
                size={17}
                aria-hidden="true"
                className="arrow-travel"
              />
            </Link>
            <Link
              href="/services"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm border border-ink/25 px-6 py-3.5 font-medium transition-colors duration-(--dur-base) ease-out-quint hover:border-ink hover:text-paper"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-bottom scale-y-0 bg-ink transition-transform duration-(--dur-slow) ease-out-quint group-hover:scale-y-100"
              />
              <span className="relative">{t("services")}</span>
            </Link>
            <Link
              href="/contact"
              className="link-sweep ml-1 text-sm text-ink-faint transition-colors duration-(--dur-base) hover:text-ink"
            >
              {t("contact")}
            </Link>
          </div>
        </Reveal>

        {/* A broken internal link is our bug, not the visitor's - so ask. */}
        <Reveal delay={0.26}>
          <p className="mt-12 max-w-[52ch] border-t border-border pt-6 font-mono text-xs leading-relaxed text-ink-faint">
            {t("hint")}{" "}
            <a
              href={`mailto:${site.email}`}
              className="link-sweep text-ink-soft"
            >
              {site.email}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
