"use client"

import Image from "next/image"
import { useUser } from "../../providers/UserProvider"

export default function UserComponent() {
  const user = useUser()

  return (
    <header className="flex gap-4 items-center">
      <Image
        alt={user.name}
        src={user.image}
        width={100}
        height={100}
        className="rounded-md border-2 border-primary"
      />
      <h1 className="font-cinzel text-2xl">{user.name}</h1>
    </header>
  )
}
