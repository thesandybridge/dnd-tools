import styles from "./page.module.css"

export default function ToolsLayout({ children }) {
  return (
    <main className={styles.main}>
      <div className={styles.tools}>
        {children}
      </div>
    </main>
  )
}
