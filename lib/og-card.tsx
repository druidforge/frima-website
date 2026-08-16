import { markDataUri, serviceOgImageDataUri } from "@/lib/og";

/**
 * Shared visual language for every generated social card: dark ground, the
 * mark bled off an edge, a cyan-to-violet gradient bar, the same type scale.
 * One page (home) used to hardcode all of this; every other route now needs
 * the same treatment, so it lives here once instead of six times.
 */
const bg = "#16131d";
const ink = "#f5f4f0";
const inkMuted = "#b6a9d4";
const gradient = "linear-gradient(90deg, #07EBEE 0%, #954CFB 100%)";

/**
 * Text-only card: home, about, contact, the services index. No photography
 * to hang the layout on, so the mark itself is the visual anchor.
 */
export function GenericOgCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: bg,
        padding: 72,
        position: "relative",
      }}
    >
      {/* Bleeds off the right edge so the card reads as a crop of something
          larger rather than a centred logo lockup. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={markDataUri}
        width={620}
        height={620}
        style={{ position: "absolute", right: -130, top: 40, opacity: 0.9 }}
        alt=""
      />

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#07EBEE",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            color: ink,
            fontWeight: 700,
            display: "flex",
          }}
        >
          DRUID FORGE
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 780 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            color: "#07EBEE",
            fontWeight: 700,
            display: "flex",
            marginBottom: 20,
          }}
        >
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 60,
            lineHeight: 1.05,
            color: ink,
            fontWeight: 700,
            letterSpacing: -1.5,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 26,
            lineHeight: 1.4,
            color: inkMuted,
            display: "flex",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ display: "flex", height: 6, width: 300, background: gradient }} />
    </div>
  );
}

/** Fixed pixel box the service photo is pre-cropped to - see `lib/og.ts`. */
const PHOTO_WIDTH = 480;

/**
 * Photo-backed card for a single service: brand panel on the left, that
 * service's own photography filling the right edge, so a shared "Web
 * Applications" link no longer looks identical to a shared "Business Cards"
 * one.
 */
export function ServiceOgCard({
  eyebrow,
  title,
  subtitle,
  from,
  imageBasename,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  from: string;
  imageBasename: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: bg,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 1200 - PHOTO_WIDTH,
          padding: 68,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#07EBEE",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 7,
              color: ink,
              fontWeight: 700,
              display: "flex",
            }}
          >
            DRUID FORGE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 4,
              color: "#07EBEE",
              fontWeight: 700,
              display: "flex",
              marginBottom: 18,
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 54,
              lineHeight: 1.08,
              color: ink,
              fontWeight: 700,
              letterSpacing: -1.2,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 24,
              lineHeight: 1.45,
              color: inkMuted,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              height: 6,
              width: 160,
              background: gradient,
            }}
          />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 1,
              color: inkMuted,
              display: "flex",
            }}
          >
            {from}
          </div>
        </div>
      </div>

      {/* Seam accent between the text panel and the photo, echoing the
          gradient bar rather than a plain hairline. */}
      <div
        style={{
          display: "flex",
          width: 6,
          height: "100%",
          background: gradient,
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={serviceOgImageDataUri(imageBasename)}
        width={PHOTO_WIDTH - 6}
        height={630}
        style={{ display: "flex" }}
        alt=""
      />
    </div>
  );
}
