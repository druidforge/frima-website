"use client";

import { useTranslations } from "next-intl";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { CountUp, Reveal, RevealWords } from "@/components/motion-primitives";

/** Mock figures. Swap the numbers when the real ones arrive. */
const figures = [
  { key: "projects", value: 84, suffix: "" },
  { key: "years", value: 6, suffix: "" },
  { key: "clients", value: 71, suffix: "%" },
] as const;

export function Stats() {
  const t = useTranslations("home");

  return (
    <section className="on-abyss relative overflow-clip py-28 md:py-36">
      <ChromatophoreField
        seed={101}
        hue={[10, -14]}
        spacing={30}
        intensity={0.55}
        interactive={false}
      />

      <div className="shell relative z-10">
        <p className="eyebrow">{t("statsTitle")}</p>
        <RevealWords
          text={t("thesisTitle")}
          as="h2"
          className="mt-5 max-w-[18ch] font-display text-(length:--text-step-4) font-semibold"
        />
        <Reveal delay={0.1}>
          <p className="mt-7 max-w-[56ch] text-(length:--text-step-1) leading-[1.55] text-muted-foreground">
            {t("thesisBody")}
          </p>
        </Reveal>

        <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border pt-10 sm:gap-10 md:mt-20 lg:grid-cols-4">
          {figures.map((figure, index) => (
            <Reveal key={figure.key} delay={index * 0.08}>
              <div className="group text-center lg:text-left">
                <dd className="font-display text-[clamp(1.9rem,1.1rem+3.4vw,4.5rem)] font-semibold leading-none tabular-nums transition-transform duration-(--dur-slow) ease-out-quint group-hover:-translate-y-1">
                  <CountUp value={figure.value} suffix={figure.suffix} />
                </dd>
                <dt className="mt-3 text-sm text-muted-foreground transition-colors duration-(--dur-base) group-hover:text-foreground">
                  {t(`stats.${figure.key}`)}
                </dt>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.24}>
            <div className="group text-center lg:text-left">
              <dd className="font-display text-[clamp(1.9rem,1.1rem+3.4vw,4.5rem)] font-semibold leading-none transition-transform duration-(--dur-slow) ease-out-quint group-hover:-translate-y-1">
                {t("responseValue")}
              </dd>
              <dt className="mt-3 text-sm text-muted-foreground transition-colors duration-(--dur-base) group-hover:text-foreground">
                {t("stats.response")}
              </dt>
            </div>
          </Reveal>
        </dl>
      </div>
    </section>
  );
}
