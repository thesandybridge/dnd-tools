import ItemCalculator from "@/app/tools/components/calculator/ItemCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="max-w-[900px] gap-1 flex w-full flex-col justify-center items-center">
      <Nav />
      <ItemCalculator />
    </div>
  )
}
