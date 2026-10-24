import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Serif_Display, Geist } from "next/font/google";
import "./globals.css";
import SiteFooter from "./site-footer";
import PageMotion from "./page-motion";
import Analytics from "./analytics";
import Script from "next/script";
import SiteTheme from "./site-theme";
import PremiumGate from "./premium-gate";
import AccountPreferences from "./account-preferences";
import {themeBootstrap} from "@/lib/account/theme";

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
  title: "Meta Aprovação",
  description:
    "Uma plataforma de preparação para o Vestibulinho da ETEC e processos seletivos de Institutos Federais. Em desenvolvimento.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${displayFont.variable} antialiased`}
      suppressHydrationWarning
    >
      <body><Script id="meta-theme" strategy="beforeInteractive">{themeBootstrap}</Script><SiteTheme/>{children}<SiteFooter/><Suspense fallback={null}><PageMotion/><Analytics/><PremiumGate/><AccountPreferences/></Suspense></body>
    </html>
  );
}
