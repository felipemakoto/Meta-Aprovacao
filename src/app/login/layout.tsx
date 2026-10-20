import type { Metadata } from "next";
import StudyShell from "../study-shell";
import styles from "./login.module.css";
export const metadata: Metadata = { title: "Minha conta | Meta Aprovação", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <StudyShell active="account" focus menu><main className={styles.layout}>{children}</main></StudyShell>;
}
