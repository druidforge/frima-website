import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { locales, type Locale } from "@/i18n/routing";
import { markDataUri, ogSize } from "@/lib/og";

export const alt = "Druid Forge — digital studio, Split";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Social card, generated per locale so a shared link previews in the language
 * of the page that was actually shared.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const th = await getTranslations({ locale, namespace: "home" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#16131d",
        padding: 72,
        position: "relative",
      }}
    >
      {/* Bleed the mark off the right edge so the card reads as a crop of
            something larger rather than a centred logo lockup. */}
      <img
        src={markDataUri}
        width={620}
        height={620}
        style={{
          position: "absolute",
          right: -130,
          top: 40,
          opacity: 0.9,
        }}
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
            color: "#f5f4f0",
            fontWeight: 700,
            display: "flex",
          }}
        >
          DRUID FORGE
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
        <div
          style={{
            fontSize: 68,
            lineHeight: 1.02,
            color: "#f5f4f0",
            fontWeight: 700,
            letterSpacing: -2,
            display: "flex",
          }}
        >
          {th("heroTitle")}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 28,
            color: "#b6a9d4",
            display: "flex",
          }}
        >
          {t("title")}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          height: 6,
          width: 300,
          background: "linear-gradient(90deg, #07EBEE 0%, #954CFB 100%)",
        }}
      />
    </div>,
    size,
  );
}
