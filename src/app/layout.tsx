import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LavaApp — Gestão de Lava Jato",
  description: "Sistema de gestão para lava jatos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
