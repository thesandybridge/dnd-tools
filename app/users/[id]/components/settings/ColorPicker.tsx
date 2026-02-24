"use client"

import { ColorPicker, useColor } from "react-color-palette"
import "react-color-palette/css"
import { useTheme } from "@/app/providers/ThemeProvider"
import { updateUser } from "@/lib/users"
import { useMutation } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const themes = [
  { name: "parchment", label: "Parchment", color: "#c8a44e" },
  { name: "shadowfell", label: "Shadowfell", color: "#8b5cf6" },
  { name: "dragonfire", label: "Dragonfire", color: "#dc4a4a" },
  { name: "feywild", label: "Feywild", color: "#4ade80" },
] as const

export default function ColorPickerComponent({ userId }) {
  const { theme, changePrimaryColor, toggleThemeMode, setThemeName } = useTheme()
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
      <div className="flex flex-col gap-6 w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="font-cinzel">Theme</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setThemeName(t.name)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                    theme.themeName === t.name
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border border-border"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={theme.themeMode === "dark"}
                onCheckedChange={toggleThemeMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-cinzel">Accent Color</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="min-w-[25vw]">
                <ColorPicker color={color} onChange={setColor} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
