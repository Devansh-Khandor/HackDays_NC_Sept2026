import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusFix AI — See it. Report it. Fix it.",
    short_name: "CampusFix AI",
    description:
      "A multimodal campus operations agent powered by Google Gemini. Turn a photo into an actionable service request.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#cc292b",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
