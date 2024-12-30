import MountCalculator from "@/app/tools/components/calculator/MountCalculator"
import Nav from "../components/Nav"
import styles from "../page.module.css"
export default function Page() {
  return (
    <div className={styles.calcWrap}>
      <Nav />
      <MountCalculator />
    </div>
  )
}
