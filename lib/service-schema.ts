/**
 * The `@id` that makes a service one entity across the site.
 *
 * Two components emit a node for the same service: the organisation's
 * `hasOfferCatalog` in `components/structured-data.tsx`, which lists all six on
 * every page, and `components/service-schema.tsx`, which describes one in full
 * on its own page. They are the same thing and have to say so, which in
 * JSON-LD means carrying an identical `@id`.
 *
 * It lives here, as one function over the page's canonical URL, so the two
 * cannot drift apart - a fragment typed out twice is a fragment that gets
 * edited once.
 */
export function serviceNodeId(canonicalUrl: string) {
  return `${canonicalUrl}#service`;
}
