import TransportationCalculator from "@/app/tools/components/calculator/TravelCalculator";
import Nav from "../components/Nav";
import styles from "../page.module.css"

export default function Page() {
  return (
    <div className={styles.calcWrap}>
      <Nav />
      <TransportationCalculator />
    </div>
  )
}
