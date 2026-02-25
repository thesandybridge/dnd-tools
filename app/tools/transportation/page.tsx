import TransportationCalculator from "@/app/tools/components/calculator/TravelCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Nav />
      <TransportationCalculator />
    </div>
  )
}
