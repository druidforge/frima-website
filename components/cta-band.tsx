"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Magnetic } from "@/components/interactions";
import { Reveal, RevealWords } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

/** Closing band, reused by every page so the exit is consistent. */
export function CtaBand({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: string;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("contact");

  return (
    <section className="relative overflow-clip border-t border-border py-28 md:py-36">
      {/* The field returns at the exit, quieter than at the hero - the page
          opens and closes on the same motif. */}
      <ChromatophoreField
        seed={7}
        hue={[6, -10]}
        spacing={32}
        intensity={0.4}
        interactive={false}
        className="opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_20%_50%,var(--color-paper)_25%,transparent_80%)]"
      />

      <div className="shell relative z-10">
        <RevealWords
          text={title}
          as="h2"
          className="max-w-[18ch] font-display text-(length:--text-step-4) font-semibold"
        />
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-[52ch] text-(length:--text-step-1) leading-[1.55] text-ink-soft">
            {body}
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Magnetic>
              <Link
                href="/contact"
                className="btn-ink group inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3.5 font-medium text-paper"
              >
                {action ?? t("ctaButton")}
                <ArrowUpRight
                  size={17}
                  aria-hidden="true"
                  className="arrow-travel"
                />
              </Link>
            </Magnetic>
            <span className="font-mono text-sm text-ink-faint">
              {tc("emailLabel")}{" "}
              <a href={`mailto:${site.email}`} className="link-sweep text-ink">
                {site.email}
              </a>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
