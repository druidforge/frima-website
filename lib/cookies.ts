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

export const cookieTable: Record<"necessary" | "analytics", CookieRow[]> = {
  necessary: [
    {
      name: "cc_cookie",
      domain: "druidforge.hr",
      duration: "6m",
      descriptionKey: "ccCookie",
    },
    {
      name: "NEXT_LOCALE",
      domain: "druidforge.hr",
      duration: "12m",
      descriptionKey: "localeCookie",
    },
  ],
  analytics: [
    {
      name: "_pk_id",
      domain: "druidforge.hr",
      duration: "13m",
      descriptionKey: "analyticsId",
    },
    {
      name: "_pk_ses",
      domain: "druidforge.hr",
      duration: "session",
      descriptionKey: "analyticsSession",
    },
  ],
};
