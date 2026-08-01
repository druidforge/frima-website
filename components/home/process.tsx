"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { RevealWords } from "@/components/motion-primitives";

const steps = ["step1", "step2", "step3", "step4"] as const;

/**
 * The one place numbering is honest: these steps really are sequential, and
 * each depends on the one before it.
 *
 * A single scrubbed timeline draws the spine and lights each step as it is
 * reached, so the reader's scroll position maps directly onto project stage.
 */
export function Process() {
  const t = useTranslations("home");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    let revert: (() => void) | undefined;
    let cancelled = false;

    /**
     * GSAP is imported here and nowhere else.
     *
     * It used to be pulled in by a layout-level component, which meant every
     * page in the site downloaded it even though this section is the only
     * ScrollTrigger on the site and only exists on the homepage.
     */
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-spine]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 65%",
              end: "bottom 75%",
              scrub: 0.6,
            },
          },
        );

        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
          gsap.fromTo(
            step,
            { opacity: 0.25, x: -14 },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: step, start: "top 78%" },
            },
          );
        });
      }, el);

      /**
       * ScrollTrigger caches each trigger's start and end on creation, so
       * anything that changes the page height afterwards - fonts swapping in,
       * the canvases sizing themselves - leaves those numbers stale and the
       * timeline fires at the wrong scroll position. Re-measure on resize.
       */
      const observer = new ResizeObserver(() => ScrollTrigger.refresh());
      observer.observe(document.body);

      revert = () => {
        observer.disconnect();
        ctx.revert();
      };
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section className="py-28 md:py-36">
      <div className="shell" ref={root}>
        <p className="eyebrow">{t("processTitle")}</p>
        <RevealWords
          text={t("processLead")}
          as="h2"
          className="mt-5 max-w-[26ch] font-display text-(length:--text-step-3) font-semibold"
        />

        <ol className="relative mt-16 pl-12 md:pl-20">
          {/* Spine sits behind the markers and draws on scroll. */}
          <span
            aria-hidden="true"
            className="absolute left-[0.9rem] top-2 h-[calc(100%-2rem)] w-px bg-border md:left-[1.4rem]"
          />
          <span
            aria-hidden="true"
            data-spine
            className="absolute left-[0.9rem] top-2 h-[calc(100%-2rem)] w-px origin-top bg-gradient-to-b from-cyan to-violet md:left-[1.4rem]"
          />

          {steps.map((step, index) => (
            <li key={step} data-step className="relative pb-14 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-12 top-0 flex size-[1.85rem] items-center justify-center rounded-full border border-border bg-background font-mono text-[0.7rem] md:-left-20 md:size-[2.9rem] md:text-xs"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-(length:--text-step-2) font-semibold tracking-tight">
                {t(`process.${step}Title`)}
              </h3>
              <p className="mt-3 max-w-[54ch] text-ink-soft">
                {t(`process.${step}Body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
