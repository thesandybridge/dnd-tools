"use client"

import Image from "next/image"
import { ColorPicker, useColor } from "react-color-palette"
import "react-color-palette/css"
import { useTheme } from "@/app/providers/ThemeProvider"
import { updateUser } from "@/lib/users"
import { useMutation } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from "./user.module.css"

export default function UserComponent({ user }) {
  const { theme, changePrimaryColor } = useTheme()
  const [color, setColor] = useColor(theme.primaryColor)

  const { mutate, isPending } = useMutation({
    mutationFn: (newColor) => updateUser(user.id, { color: newColor }),
    onMutate: (newColor) => {
      changePrimaryColor(newColor)
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(`${user.name}'s profile saved!`)
    },
  })

  const handleSave = (e) => {
    e.preventDefault()
    mutate(color.hex)
  }

  return (
    <main className={styles.main}>
      <ToastContainer theme={theme.themeMode} />
      <header className={styles.header}>
        <Image
          alt={user.name}
          src={user.image}
          width={100}
          height={100}
          style={{
            border: `solid 2px ${color.hex}`,
            borderRadius: '5px',
          }}
        />
        <h1>{user.name}</h1>
      </header>
      <section className={styles.userDetails}>
        <form onSubmit={handleSave} className={styles.userForm}>
          <div className={styles.colorPicker}>
            <h3>Theme Color</h3>
            <ColorPicker
              color={color}
              onChange={setColor}
            />
          </div>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>
    </main>
  )
}
