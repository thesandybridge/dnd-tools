import MountCalculator from "@/app/tools/components/calculator/MountCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Nav />
      <MountCalculator />
    </div>
  )
}
