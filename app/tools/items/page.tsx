import ItemCalculator from "@/app/tools/components/calculator/ItemCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Nav />
      <ItemCalculator />
    </div>
  )
}
