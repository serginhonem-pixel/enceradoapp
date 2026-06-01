import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sopinha Lava-Jato",
  description: "Sistema de gestão do lava jato",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lava-Jato",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
