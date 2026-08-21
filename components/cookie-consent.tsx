"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as CC from "vanilla-cookieconsent";

import "vanilla-cookieconsent/dist/cookieconsent.css";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cookieTable } from "@/lib/cookies";

/**
 * There's no regulatory "standard" delay - GDPR/ePrivacy require consent
 * *before* any non-essential cookie is set, not that the banner appear
 * within any given number of seconds. That's already true regardless of this
 * value: analytics stays `enabled: false` and nothing in `<GoogleAnalytics>`
 * loads until a real accept, so a visitor sees the page first and the
 * banner second without anything firing in between.
 */
const BANNER_DELAY_MS = 6000;

/**
 * GDPR consent gate.
 *
 * Nothing beyond the necessary category runs before an explicit opt-in:
 * analytics is declared `enabled: false`, so the plugin will not fire its
 * scripts until consent is granted. Accept and reject carry equal visual
 * weight, which is the part most banners get wrong and regulators pursue.
 */
export function CookieConsent() {
  const locale = useLocale() as Locale;
  const t = useTranslations("cookies");

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const privacyHref = getPathname({ href: "/privacy", locale });
    const cookieHref = getPathname({ href: "/cookies", locale });

    const headers = {
      name: t("tableName"),
      domain: t("tableDomain"),
      desc: t("tableDescription"),
      exp: t("tableExpiration"),
    };

    const rows = (category: "necessary" | "analytics") =>
      cookieTable[category].map((row) => ({
        name: row.name,
        domain: row.domain,
        exp: row.duration === "session" ? t("session") : row.duration,
        desc: t(row.descriptionKey),
      }));

    /**
     * Tells `<GoogleAnalytics>` whether it's allowed to load, without that
     * component needing its own import of the CC singleton. Fired on first
     * consent, on every later page load (so a returning visitor who already
     * opted in doesn't have to re-accept), and whenever the visitor changes
     * their preference via the modal.
     */
    const broadcastAnalyticsConsent = () => {
      window.dispatchEvent(
        new CustomEvent("cc:analytics", {
          detail: CC.acceptedCategory("analytics"),
        }),
      );
    };

    void CC.run({
      // Shown manually, after a delay, below - see `BANNER_DELAY_MS`.
      autoShow: false,
      revision: 1,
      onConsent: broadcastAnalyticsConsent,
      onChange: broadcastAnalyticsConsent,
      guiOptions: {
        consentModal: { layout: "box", position: "bottom left" },
        preferencesModal: { layout: "box", equalWeightButtons: true },
      },
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          enabled: false,
          autoClear: {
            cookies: [{ name: /^_ga/ }],
          },
        },
      },
      language: {
        default: locale,
        translations: {
          [locale]: {
            consentModal: {
              label: t("bannerTitle"),
              title: t("bannerTitle"),
              description: t("bannerBody"),
              acceptAllBtn: t("acceptAll"),
              acceptNecessaryBtn: t("rejectAll"),
              showPreferencesBtn: t("manage"),
              footer: `<a href="${privacyHref}">${t("prefTitle")}</a>`,
            },
            preferencesModal: {
              title: t("prefTitle"),
              acceptAllBtn: t("prefAcceptAll"),
              acceptNecessaryBtn: t("prefRejectAll"),
              savePreferencesBtn: t("prefSave"),
              closeIconLabel: t("prefClose"),
              sections: [
                { description: t("prefDescription") },
                {
                  title: t("necessaryTitle"),
                  description: t("necessaryBody"),
                  linkedCategory: "necessary",
                  cookieTable: { headers, body: rows("necessary") },
                },
                {
                  title: t("analyticsTitle"),
                  description: t("analyticsBody"),
                  linkedCategory: "analytics",
                  cookieTable: { headers, body: rows("analytics") },
                },
                {
                  description: `<a href="${cookieHref}">${t("prefTitle")}</a>`,
                },
              ],
            },
          },
        },
      },
    }).then(() => {
      // A returning visitor with a stored, still-valid choice never needs
      // the banner at all - only a first-time (or expired-consent) visitor
      // waits out the delay before seeing it.
      if (!CC.validConsent()) {
        showTimer = setTimeout(() => CC.show(), BANNER_DELAY_MS);
      }
    });

    return () => clearTimeout(showTimer);
  }, [locale, t]);

  return null;
}
