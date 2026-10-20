import StudyShell from "../study-shell";
import styles from "../information.module.css";

export default function InformationLayout({children}:{children:React.ReactNode}) {
  return <StudyShell focus menu homeHref="/"><main className={styles.article}>{children}</main></StudyShell>;
}
