import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitLook — Pack smarter, travel in style",
    short_name: "FitLook",
    description: "Your AI virtual stylist for every trip you take.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0c09",
    theme_color: "#c8ff3d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
