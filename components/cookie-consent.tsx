"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as CC from "vanilla-cookieconsent";

import "vanilla-cookieconsent/dist/cookieconsent.css";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cookieTable } from "@/lib/cookies";

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

    void CC.run({
      autoShow: true,
      revision: 1,
      guiOptions: {
        consentModal: { layout: "box", position: "bottom left" },
        preferencesModal: { layout: "box", equalWeightButtons: true },
      },
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          enabled: false,
          autoClear: {
            cookies: [{ name: /^_pk_/ }],
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
    });
  }, [locale, t]);

  return null;
}
