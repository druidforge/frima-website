"use client";

import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Magnetic } from "@/components/interactions";
import { RevealWords } from "@/components/motion-primitives";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);

  // The copy lifts and fades as the field disperses, so the hero hands off to
  // the next section instead of just scrolling away.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    // Column layout, not centred-with-absolute-cue. The copy takes the free
    // space and the scroll cue is a real flow item after it, so the cue can
    // never be pushed past the fold no matter how tall the headline wraps.
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-clip pt-[4.5rem]"
    >
      {/* Sits right of centre: the copy occupies the left of the hero, and the
          radial wash below already keeps that side clear. Tighter spacing than
          the ambient fields because this one has to render a recognisable
          shape, not just texture. */}
      <ChromatophoreField
        seed={17}
        silhouette
        markX={0.7}
        markScale={0.5}
        spacing={16}
        intensity={0.95}
        className="opacity-[0.85]"
      />

      {/* Keeps the headline legible wherever the field happens to bloom. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_28%_45%,var(--color-paper)_18%,transparent_78%)]"
      />

      <motion.div
        style={{ y, opacity }}
        className="shell relative z-10 flex flex-1 flex-col justify-center py-10 md:py-14"
      >
        <p className="eyebrow">{t("heroEyebrow")}</p>

        {/* The size is capped by viewport *height* as well as width. On a wide
            but short screen a purely `vw`-based headline is what pushed the
            rest of the hero off the fold. */}
        {/* Always the first thing on the page - no reason to ask an observer
            whether it is on screen. */}
        <RevealWords
          text={t("heroTitle")}
          as="h1"
          delay={0.1}
          immediate
          className="mt-5 max-w-[15ch] font-display text-[clamp(2.5rem,min(7vw,10.5svh),6.5rem)] font-bold leading-[0.88] tracking-[-0.045em]"
        />

        {/* CSS rather than `motion`, and this element is the reason why: it is
            the homepage's LCP element, and as a `motion.p` starting at
            `opacity: 0` it could not paint until the Motion bundle had
            hydrated.

            `rise-lcp` rather than `rise-fade` for the second half of the same
            problem. Leaving JS behind fixed when the animation could start; it
            did not change that the first keyframe was still transparent, and
            `both` holds that frame through the delay. Chrome will not record an
            invisible element, so LCP was pinned to `animation-delay` no matter
            how quickly the page arrived - 0.55s of it. Dropping the opacity ramp
            leaves the element painted from the first frame while the rise plays
            out unchanged. See the note above `@keyframes rise-lcp` in
            `app/globals.css`.

            The delay is short rather than zero so the paragraph still follows
            the headline in rather than arriving with it. */}
        <p
          className="rise-lcp mt-6 max-w-[52ch] text-(length:--text-step-1) leading-[1.5] text-ink-soft"
          style={{ animationDelay: "0.15s" }}
        >
          {t("heroLead")}
        </p>

        <div
          className="rise-fade mt-8 flex flex-wrap items-center gap-3 md:mt-10"
          style={{ animationDelay: "0.7s" }}
        >
          {/* One magnetic element per page, and this is it. */}
          <Magnetic>
            <Link
              href="/contact"
              className="btn-ink group inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3.5 font-medium text-paper"
            >
              {t("heroPrimary")}
              <ArrowUpRight size={17} className="arrow-travel" />
            </Link>
          </Magnetic>
          <Link
            href="/services"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm border border-ink/25 px-6 py-3.5 font-medium transition-colors duration-(--dur-base) ease-out-quint hover:border-ink hover:text-paper"
          >
            {/* Ink floods up from the base rather than fading in. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 origin-bottom scale-y-0 bg-ink transition-transform duration-(--dur-slow) ease-out-quint group-hover:scale-y-100"
            />
            <span className="relative">{t("heroSecondary")}</span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity }}
        className="shell relative z-10 flex shrink-0 justify-center pb-7 md:pb-9"
      >
        <span className="flex flex-col items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink-faint">
          {t("heroScroll")}
          {/* Drifts down and eases back, with a pause at the top of each cycle
              so it reads as a beckon rather than a metronome. */}
          <motion.span
            animate={{ y: [0, 7, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              repeatDelay: 0.35,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <ArrowDown size={14} />
          </motion.span>
        </span>
      </motion.div>
    </section>
  );
}
