"use client"

import Image from "next/image"
import "react-color-palette/css"
import { useTheme } from "@/app/providers/ThemeProvider"
import 'react-toastify/dist/ReactToastify.css'
import styles from "./user.module.css"
import { useUser } from "../../providers/UserProvider"

export default function UserComponent() {
  const { theme } = useTheme()
  const user = useUser()

  return (
    <>
      <header className={styles.header}>
        <Image
          alt={user.name}
          src={user.image}
          width={100}
          height={100}
          style={{
            border: `solid 2px ${theme.primaryColor}`,
            borderRadius: '5px',
          }}
        />
        <h1>{user.name}</h1>
      </header>
    </>
  )
}
