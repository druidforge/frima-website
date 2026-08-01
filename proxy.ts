import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`. next-intl still
 * ships its handler under the middleware name; only the export site changed.
 */
export const proxy = createMiddleware(routing);

export const config = {
  // Skip Next internals, the API surface, and anything with a file extension
  // (robots.txt, sitemap.xml, icon.svg, static assets).
  //
  // `apple-icon` and `manifest` are named explicitly: they are generated
  // metadata routes with no extension, so the extension rule alone would let
  // them through and they would get locale-redirected into a 307.
  matcher: ["/((?!api|_next|_vercel|apple-icon|manifest|.*\\..*).*)"],
};
