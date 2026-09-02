/**
 * One declaration of every cookie the site sets, shared by the consent modal
 * and the public cookie policy page. Keeping a single list is what stops the
 * two from drifting apart, which is the usual way a cookie policy becomes
 * inaccurate and therefore non-compliant.
 */
export type CookieRow = {
  name: string;
  domain: string;
  /** Message key under `cookies` for the human description. */
  duration: "session" | string;
  descriptionKey: string;
};

export type CookieCategory = "necessary" | "analytics" | "ads";

export const cookieTable: Record<CookieCategory, CookieRow[]> = {
  necessary: [
    {
      name: "cc_cookie",
      domain: "druid-forge.hr",
      duration: "6m",
      descriptionKey: "ccCookie",
    },
    {
      name: "NEXT_LOCALE",
      domain: "druid-forge.hr",
      duration: "12m",
      descriptionKey: "localeCookie",
    },
  ],
  analytics: [
    {
      name: "_ga",
      domain: "druid-forge.hr",
      duration: "24m",
      descriptionKey: "analyticsId",
    },
    {
      name: "_ga_*",
      domain: "druid-forge.hr",
      duration: "24m",
      descriptionKey: "analyticsSession",
    },
  ],
  ads: [
    {
      name: "_gcl_au",
      domain: "druid-forge.hr",
      duration: "3m",
      descriptionKey: "adsLinker",
    },
    {
      name: "_gcl_aw",
      domain: "druid-forge.hr",
      duration: "3m",
      descriptionKey: "adsClick",
    },
    {
      name: "test_cookie",
      domain: "doubleclick.net",
      duration: "15min",
      descriptionKey: "adsTestCookie",
    },
  ],
};
