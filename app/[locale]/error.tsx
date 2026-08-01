"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Reveal, RevealWords } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-clip pt-[4.5rem]">
      {/* Warmer hue than the 404 and no silhouette: something went wrong, so
          the animal is not posing for it. */}
      <ChromatophoreField
        seed={500}
        hue={[-30, -12]}
        spacing={24}
        intensity={0.6}
        interactive={false}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_26%_45%,var(--color-paper)_20%,transparent_78%)]"
      />

      <div className="shell relative z-10 flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow">{t("eyebrow")}</p>

        <RevealWords
          text={t("title")}
          as="h1"
          className="mt-5 max-w-[16ch] font-display text-[clamp(2.2rem,min(6vw,9svh),5rem)] font-bold tracking-[-0.04em]"
        />

        <Reveal delay={0.1}>
          <p className="mt-7 max-w-[56ch] text-(length:--text-step-1) leading-[1.55] text-ink-soft">
            {t("body")}
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-ink group inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3.5 font-medium text-paper"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className="transition-[transform,rotate] duration-(--dur-slow) ease-out-quint group-hover:rotate-180"
              />
              {t("retry")}
            </button>
            <Link
              href="/"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm border border-ink/25 px-6 py-3.5 font-medium transition-colors duration-(--dur-base) ease-out-quint hover:border-ink hover:text-paper"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-bottom scale-y-0 bg-ink transition-transform duration-(--dur-slow) ease-out-quint group-hover:scale-y-100"
              />
              <span className="relative">{t("home")}</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.26}>
          <div className="mt-12 max-w-[52ch] border-t border-border pt-6">
            <p className="font-mono text-xs leading-relaxed text-ink-faint">
              {t("hint", { email: site.email })}
            </p>
            {/* The digest is the only handle support has on a specific failure,
                so it is shown plainly rather than buried in the console. */}
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-ink-faint">
                {t("reference")}:{" "}
                <code className="select-all rounded-sm bg-stone px-1.5 py-0.5 text-ink-soft">
                  {error.digest}
                </code>
              </p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
