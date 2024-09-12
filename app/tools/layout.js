import styles from "./page.module.css"
import ToolsNav from "@/app/components/navigation/Tools"

export default function ToolsLayout({ children }) {
  return (
    <main className={styles.main}>
      <ToolsNav />
      <div className={styles.tools}>
        {children}
      </div>
    </main>
  )
}
