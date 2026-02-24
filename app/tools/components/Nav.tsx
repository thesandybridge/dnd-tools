import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function Nav() {
  return (
    <Link className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group" href="/tools">
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      Back
    </Link>
  )
}
