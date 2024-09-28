import Calculator from "./components/calculator/Calculator"
import { CurrencyProvider } from "./context/CurrencyContext"
import styles from "./page.module.css"

export default function ToolsLayout({ children }) {
  return (
    <CurrencyProvider>
      <main className={styles.main}>
        <Calculator />
        <div className={styles.tools}>
          {children}
        </div>
      </main>
    </CurrencyProvider>
  )
}
