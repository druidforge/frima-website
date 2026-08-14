"use client";

import { useRef, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
  name: string;
};

/**
 * `Archicon-website.jpg` -> `Archicon Website`. The card label is read
 * straight off the file on disk rather than a separate hand-typed list, so
 * the two can never drift apart - dropping a new screenshot in and renaming
 * the file *is* renaming the card. A segment that is already all-caps (`KF`,
 * `CRM`) is left alone rather than title-cased into `Kf`/`Crm`.
 */
function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  return base
    .split("-")
    .map((word) => (word === word.toUpperCase() ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

// Real project screenshots, `/public/gallery`. The nine phone shots have
// their status bar already cropped off (see the sibling note in that
// folder) - this component just displays whatever is there.
const FILES = [
  // Archicon
  "Archicon-website.jpg",
  "Archicon-flyer.png",
  "Archicon-logo-design.jpg",
  // Profina Vuletić, then Profina
  "Profina-Vuletic-website.jpg",
  "Profina-Vuletic-business-card.png",
  "Profina-CRM-web-app.jpg",
  // Mobile game, then mobile app
  "Fallen-Kingdom-mobile-game.jpg",
  "Souvenir-tracker-mobile-app.jpg",
  // The rest of the web apps
  "Clay-workshop-web-app.jpg",
  "Fizilab-web-app.jpg",
  "KF-tracker-web-app.jpg",
  "Offer-converter-web-app.jpg",
  "Wedding-seating-planner-web-app.png",
];

const ITEMS: GalleryItem[] = FILES.map((file, index) => ({
  id: index + 1,
  image: `/gallery/${file}`,
  name: titleFromFilename(file),
}));

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

  // Smaller stack and steps on phones - the desktop values stack the cards
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
      {/* A plain light-on-image label read fine over the reference set's
          uniformly dark photography, but these screenshots include plenty of
          near-white sections (Archicon, FiziLab) that the same white-on-image
          text disappeared into. A small solid chip behind it holds contrast
          no matter what is under it. */}
      <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-[3px] bg-ink/55 px-1.5 py-0.5 font-mono text-[0.65rem] leading-none text-paper backdrop-blur-[2px] transition-colors duration-(--dur-base) group-hover:bg-ink/75">
        {item.name}
      </span>
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="(max-width: 767px) 190px, 300px"
        className="object-cover object-top brightness-75 transition-[filter] duration-(--dur-slow) group-hover:brightness-100"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/25 to-transparent"
      />
    </motion.div>
  );
}
