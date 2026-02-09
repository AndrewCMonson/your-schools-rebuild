import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YourSchools",
    short_name: "YourSchools",
    description: "Search and compare early education schools by location, tuition, reviews, and verified claims.",
    start_url: "/",
    display: "browser",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
