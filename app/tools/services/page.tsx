import ServicesCalculator from "@/app/tools/components/calculator/ServiceCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Nav />
      <ServicesCalculator />
    </div>
  )
}
