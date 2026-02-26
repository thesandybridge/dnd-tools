import { Spinner } from "@/app/components/ui/Spinner"

export default function Loading() {
  return (
    <div className="flex w-full justify-center h-dvh items-center">
      <Spinner />
    </div>
  )
}
