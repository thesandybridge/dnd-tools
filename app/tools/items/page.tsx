import ItemCalculator from "@/app/tools/components/calculator/ItemCalculator"
import Nav from "../components/Nav"
import styles from "../page.module.css"

export default function Page() {
  return (
    <div className={styles.calcWrap}>
      <Nav />
      <ItemCalculator />
    </div>
  )
}
