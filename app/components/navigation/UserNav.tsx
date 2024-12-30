'use client'

import Link from "next/link"
import Image from "next/image"
import { faMap, faDragon } from "@fortawesome/free-solid-svg-icons"
import { usePathname } from "next/navigation"
import SignOut from "./Logout"
import ClientIcon from "../icons/ClientIcon"

export default function UserNav({user}) {
  const path = usePathname()
  return (
    <>
      <Link href="/guilds">
        <ClientIcon
          className={`user-control ${path === '/guilds' ? 'active' : ''}`}
          title={"Guild"}
          style={{ fontSize: "25px" }}
          icon={faDragon}
        />
      </Link>
      <Link href="/map">
        <ClientIcon
          className={`user-control ${path === '/map' ? 'active' : ''}`}
          title={"Map"}
          style={{ fontSize: "25px" }}
          icon={faMap}
        />
      </Link>
      <Link href={`/users/${user.id}`}>
        <Image className="user_profile"
          src={user.image}
          alt="user profile"
          width={50} height={50} />
      </Link>
      <SignOut />
    </>
  )
}
