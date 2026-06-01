import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sopinha Lava-Jato",
    short_name: "Lava-Jato",
    description: "Sistema de gestão do lava jato",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d1b2a",
    icons: [
      {
        src: "/logo.jpeg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
  };
}
