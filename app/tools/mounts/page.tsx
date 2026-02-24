import MountCalculator from "@/app/tools/components/calculator/MountCalculator"
import Nav from "../components/Nav"

export default function Page() {
  return (
    <div className="max-w-[900px] gap-1 flex w-full flex-col justify-center items-center">
      <Nav />
      <MountCalculator />
    </div>
  )
}
