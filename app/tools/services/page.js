import ServicesCalculator from "@/app/tools/components/calculator/ServiceCalculator"
import Nav from "../components/Nav"
import styles from "../page.module.css"

export default function Page() {
  return (
    <div className={styles.calcWrap}>
      <Nav />
      <ServicesCalculator />
    </div>
  )
}
