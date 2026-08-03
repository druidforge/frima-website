import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Digital studio, Split`,
    short_name: site.name,
    description:
      "Digital studio in Split, Croatia. Websites, web and mobile apps, digital wedding invitations, business cards and flyers.",
    // Slashed, matching `trailingSlash: true` - the slashless forms all 308,
    // and an installed app should not open on a redirect.
    start_url: "/hr/",
    display: "standalone",
    background_color: "#f5f4f0",
    theme_color: "#16131d",
    icons: [
      {
        src: "/druid-forge.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      { src: "/apple-icon/", sizes: "180x180", type: "image/png" },
    ],
  };
}
