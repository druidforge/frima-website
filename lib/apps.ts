/**
 * Apps and games we publish, each with its own privacy policy page at
 * /<locale>/privacy/<slug> (`app/[locale]/privacy/[app]/page.tsx`). Adding a
 * game: add an entry here and its `legal.apps.<id>` texts in every
 * `messages/*.json`.
 *
 * The pages are `noindex` and deliberately absent from the sitemap: they exist
 * for the app stores and the in-app link, not for search.
 */
export type App = {
  /** Key of the texts under `legal.apps` and `meta.apps` in messages. */
  id: string;
  /** URL segment, identical in every language (stores link to one URL). */
  slug: string;
  name: string;
  /** ISO date of the last change to this app's policy text. */
  updated: string;
};

export const apps: App[] = [
  {
    id: "yeetTheGoober",
    slug: "yeet-the-goober",
    name: "Yeet the Goober",
    updated: "2026-11-16",
  },
];

export function getAppBySlug(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
