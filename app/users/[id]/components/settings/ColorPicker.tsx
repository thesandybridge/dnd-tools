"use client"

import { ColorPicker, useColor } from "react-color-palette"
import "react-color-palette/css"
import { useTheme } from "@/app/providers/ThemeProvider"
import { updateUser } from "@/lib/users"
import { useMutation } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from "./settings.module.css"

export default function ColorPickerComponent({ userId }) {
  const { theme, changePrimaryColor } = useTheme()
  const [color, setColor] = useColor(theme.primaryColor)

  const { mutate, isPending, error } = useMutation({
    mutationFn: (newColor) => updateUser(userId, { color: newColor }),
    onMutate: (newColor) => {
      changePrimaryColor(newColor)
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: (data) => {
      toast.success(`${data.name} Profile saved!`)
    },
  })

  const handleSave = (e) => {
    e.preventDefault()
    mutate(color.hex)
  }

  if (error) return <p>Error: {error.message}</p>

  return (
    <>
      <ToastContainer theme={theme.themeMode} />
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
    </>
  )
}
