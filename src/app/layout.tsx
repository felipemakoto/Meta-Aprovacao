import type { Metadata } from "next";
import { DM_Serif_Display, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const displayFont = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ETEC / IF — Preparação para estudar",
  description:
    "Uma plataforma de preparação para o Vestibulinho da ETEC e processos seletivos de Institutos Federais. Em desenvolvimento.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${displayFont.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
