"use client"

import Image from "next/image"
import { useUser } from "../../providers/UserProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

export default function UserComponent() {
  const user = useUser()

  return (
    <GlassPanel corona className="w-full p-6">
      <header className="flex gap-4 items-center">
        <Image
          alt={user.name}
          src={user.image}
          width={80}
          height={80}
          className="rounded-lg border-2 border-[rgba(var(--corona-rgb),0.3)] shadow-[0_0_12px_-3px_rgba(var(--corona-rgb),0.3)]"
        />
        <div>
          <h1 className="font-cinzel text-2xl">{user.name}</h1>
        </div>
      </header>
    </GlassPanel>
  )
}
