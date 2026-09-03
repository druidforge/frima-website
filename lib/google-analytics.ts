/**
 * GA4 measurement id, "G-XXXXXXXXXX" - Admin > Data Streams in the property.
 *
 * Not a secret: it ships to the browser inside the tag itself. Lives here
 * rather than inside the component so `<GoogleTagBootstrap>` can ask whether
 * there is any Google tag at all to bootstrap, mirroring `lib/google-ads.ts`.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
