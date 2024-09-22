import Calculator from "./components/calculator/Calculator"
import styles from "./page.module.css"

export default function ToolsLayout({ children }) {
  return (
    <main className={styles.main}>
      <Calculator />
      <div className={styles.tools}>
        {children}
      </div>
    </main>
  )
}
