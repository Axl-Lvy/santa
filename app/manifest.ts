import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Père Noël secret",
    short_name: "Père Noël",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe3",
    theme_color: "#1f3b2d",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
