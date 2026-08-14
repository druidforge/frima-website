"use client";

import { useRef, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { useIsCompact } from "@/lib/use-carousel";

type GalleryItem = {
  id: number;
  image: string;
};

// Placeholder frames until real project shots exist - same set (and the same
// magnetic-hover, scroll-surfed 3D stack) as the reference component this
// section is built from.
const ITEMS: GalleryItem[] = [
  { id: 1, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80" },
  { id: 2, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80" },
  { id: 3, image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80" },
  { id: 4, image: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&q=80" },
  { id: 5, image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80" },
  { id: 6, image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80" },
  { id: 7, image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80" },
  { id: 8, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80" },
  { id: 9, image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&q=80" },
  { id: 10, image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80" },
  { id: 11, image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80" },
  { id: 12, image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80" },
  { id: 13, image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&q=80" },
  { id: 14, image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80" },
  { id: 15, image: "https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=800&q=80" },
  { id: 16, image: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&q=80" },
];

/** Scroll runway devoted to each card, plus a flat release stretch at the end
 *  so the pin lets go cleanly instead of snapping. In `vh`, not px, so the
 *  pace stays the same fraction of "a screenful" on any device. */
const PER_ITEM_VH = 20;
const RELEASE_VH = 100;

/**
 * The scroll-driven 3D card surf from the reference component, adapted to
 * live as one section on a page that has five others rather than owning the
 * whole scroll.
 *
 * The original drives its scene off `window.scrollY` directly and pads the
 * page with a 50,000px spacer, so the "surf" *is* the entire scroll session -
 * fine for a dedicated collection page, but dropped in here it would force
 * every visitor to scroll roughly ten screens of nothing before reaching
 * Process or the footer. This version tracks `scrollYProgress` against its
 * own section instead (`useScroll({ target })`, the same pattern
 * `Parallax`/`SlideIn` already use), pinned via `sticky` for a bounded
 * `PER_ITEM_VH` per card, and releases back into normal flow once the last
 * card has surfaced - same feel, contained runway.
 *
 * The infinite-loop buffer (rendering the list twice, wrapping scroll
 * position with a modulo) is dropped for the same reason: it exists so an
 * unbounded page-scroll never runs out of cards to show. A bounded section
 * has a natural end - the last card - so travelling through the real list
 * once, with no duplicate tail, is the whole job.
 */
export function ProjectGallery() {
  const t = useTranslations("home");
  const isCompact = useIsCompact();

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.3,
    restDelta: 0.0005,
  });

  // Smaller stack and steps on phones - the desktop values stack 16 cards
  // across roughly 1.5x the viewport width, which is the point on a 300px
  // display.
  const stepX = isCompact ? 128 : 240;
  const stepY = isCompact ? -44 : -84;
  const stepZ = isCompact ? -150 : -288;
  const cardWidth = isCompact ? 190 : 300;
  const cardHeight = isCompact ? 254 : 400;

  const travel = ITEMS.length - 1;
  const x = useTransform(progress, [0, 1], [0, -travel * stepX]);
  const y = useTransform(progress, [0, 1], [0, -travel * stepY]);
  const z = useTransform(progress, [0, 1], [0, -travel * stepZ]);

  // The heading only needs to be read once, on arrival - it fades clear
  // within the first tenth of the scroll so it never fights the cards for
  // attention through the rest of the runway.
  const introOpacity = useTransform(progress, [0, 0.08], [1, 0]);

  // Off-screen at rest, same as the reference - the card-distance formula
  // then naturally resolves to "far", so nothing is magnetised by default.
  const mouseX = useMotionValue(-10000);
  const mouseY = useMotionValue(-10000);

  const handleMouseMove = (event: MouseEvent) => {
    mouseX.set(event.clientX);
    mouseY.set(event.clientY);
  };
  const handleMouseLeave = () => {
    mouseX.set(-10000);
    mouseY.set(-10000);
  };

  return (
    <section
      ref={sectionRef}
      className="on-abyss relative overflow-clip"
      style={{ height: `${RELEASE_VH + ITEMS.length * PER_ITEM_VH}vh` }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ChromatophoreField
          seed={101}
          hue={[10, -14]}
          spacing={30}
          intensity={0.55}
          interactive={false}
        />

        <motion.div
          style={{ opacity: introOpacity }}
          className="shell pointer-events-none absolute inset-x-0 top-[11vh] z-10 md:top-[13vh]"
        >
          <p className="eyebrow">{t("galleryEyebrow")}</p>
          <h2 className="mt-4 max-w-[16ch] font-display text-(length:--text-step-4) font-semibold leading-[0.95] tracking-tight">
            {t("galleryTitle")}
          </h2>
        </motion.div>

        <motion.p
          style={{ opacity: introOpacity }}
          className="pointer-events-none absolute bottom-[4vh] right-[5vw] z-10 font-mono text-xs uppercase tracking-wider text-ink-faint"
        >
          {t("galleryHint")}
        </motion.p>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: isCompact ? 1100 : 2000, perspectiveOrigin: "20% 20%" }}
        >
          <motion.div
            className="relative h-0 w-0"
            style={{ x, y, z, transformStyle: "preserve-3d" }}
          >
            {ITEMS.map((item, index) => (
              <Card
                key={item.id}
                item={item}
                index={index}
                stepX={stepX}
                stepY={stepY}
                stepZ={stepZ}
                width={cardWidth}
                height={cardHeight}
                mouseX={mouseX}
                mouseY={mouseY}
                progress={progress}
                label={t("galleryCardLabel")}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Card({
  item,
  index,
  stepX,
  stepY,
  stepZ,
  width,
  height,
  mouseX,
  mouseY,
  progress,
  label,
}: {
  item: GalleryItem;
  index: number;
  stepX: number;
  stepY: number;
  stepZ: number;
  width: number;
  height: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  progress: MotionValue<number>;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Distance from the pointer to this card's own screen-space centre.
  // `progress` is read only to force a recompute on every scroll tick - the
  // card's own transform moves it each frame, so its bounding box has to be
  // re-measured continuously while scrolling, not just on pointer move.
  const distance = useTransform([mouseX, mouseY, progress], (values) => {
    const [mx, my] = values as [number, number, number];
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 400;
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    return Math.hypot(mx - centerX, my - centerY);
  });

  const targetScale = useTransform(distance, [0, 400], [1.35, 1]);
  const scale = useSpring(targetScale, { mass: 0.5, stiffness: 300, damping: 20 });

  const transform = useTransform(scale, (s) => {
    const baseX = index * stepX;
    const baseY = index * stepY;
    const baseZ = index * stepZ;
    return `translate3d(${baseX}px, ${baseY}px, ${baseZ}px) rotateY(-50deg) scale(${s})`;
  });

  return (
    <motion.div
      ref={ref}
      className="group absolute overflow-hidden rounded-md shadow-2xl"
      style={{ width, height, transform, transformStyle: "preserve-3d" }}
    >
      <span className="absolute left-1 top-2 z-10 font-mono text-xs text-paper/50 transition-colors duration-(--dur-base) group-hover:text-paper/90">
        {label} {String(index + 1).padStart(2, "0")}
      </span>
      <img
        src={item.image}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover brightness-75 transition-[filter] duration-(--dur-slow) group-hover:brightness-100"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/25 to-transparent"
      />
    </motion.div>
  );
}
