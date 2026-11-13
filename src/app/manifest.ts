import type { MetadataRoute } from "next";

/** Lets phones and laptops install LiFE-OS like an app: its own window, icon and splash colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LiFE-OS · Mission LiFE",
    short_name: "LiFE-OS",
    description: "Your personal sustainability companion: footprint, nudges, community goals and rooftop solar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBF8F3",
    theme_color: "#0B2519",
    categories: ["lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
