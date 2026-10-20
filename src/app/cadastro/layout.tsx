import type { Metadata } from "next";
import StudyShell from "../study-shell";
import styles from "./signup.module.css";

export const metadata: Metadata = { title: "Criar conta | Meta Aprovação", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <StudyShell focus menu homeHref="/"><main className={styles.main}>{children}</main></StudyShell>;
}
