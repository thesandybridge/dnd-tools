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
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const themes = [
  { name: "parchment", label: "Parchment", color: "#c8a44e" },
  { name: "shadowfell", label: "Shadowfell", color: "#8b5cf6" },
  { name: "dragonfire", label: "Dragonfire", color: "#dc4a4a" },
  { name: "feywild", label: "Feywild", color: "#4ade80" },
] as const

export default function ColorPickerComponent({ userId }) {
  const { theme, updateSettings } = useTheme()
  const [color, setColor] = useColor(theme.primaryColor)

  const { mutate, isPending, error } = useMutation({
    mutationFn: (newColor) => updateUser(userId, { color: newColor }),
    onMutate: (newColor) => {
      updateSettings({ primaryColor: newColor })
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
        <GlassPanel corona className="p-6">
          <h3 className="font-cinzel text-lg font-semibold mb-4">Theme</h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => updateSettings({ themeName: t.name })}
                  className="cursor-pointer"
                >
                  <GlassPanel
                    variant="subtle"
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                      theme.themeName === t.name
                        ? "shadow-[0_0_12px_-3px_rgba(var(--corona-rgb),0.5)] border-primary/30"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border border-white/10"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs">{t.label}</span>
                  </GlassPanel>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={theme.themeMode === "dark"}
                onCheckedChange={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
              />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel corona className="p-6">
          <h3 className="font-cinzel text-lg font-semibold mb-4">Accent Color</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="min-w-[25vw]">
              <ColorPicker color={color} onChange={setColor} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </GlassPanel>
      </div>
    </>
  )
}
