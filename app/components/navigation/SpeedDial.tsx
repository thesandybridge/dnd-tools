"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, MapPin, Dice6, Calculator, X } from "lucide-react"

const actions = [
  { label: "Create Guild", icon: Shield, href: "/guilds?create=true" },
  { label: "Add Marker", icon: MapPin, href: "/map?add=true" },
  { label: "Roll Dice", icon: Dice6, href: "/tools" },
  { label: "Calculator", icon: Calculator, href: "/tools/items" },
]

function D20Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
      <polyline points="12 2 12 22" />
      <polyline points="2 8.5 22 8.5" />
      <polyline points="2 15.5 12 8.5 22 15.5" />
      <polyline points="2 8.5 12 15.5 22 8.5" />
    </svg>
  )
}

export function SpeedDial() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleAction(href: string) {
    setOpen(false)
    router.push(href)
  }

  const radius = 72
  const startAngle = -90
  const spreadAngle = 180
  const angleStep = spreadAngle / (actions.length - 1)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
        <AnimatePresence>
          {open && actions.map((action, i) => {
            const angle = (startAngle - angleStep * i) * (Math.PI / 180)
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            return (
              <motion.div
                key={action.label}
                className="absolute bottom-0 right-0"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                animate={{ opacity: 1, x, y, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              >
                <button
                  onClick={() => handleAction(action.href)}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <action.icon className="h-5 w-5" />
                  <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {action.label}
                  </span>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <motion.button
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          onClick={() => setOpen(!open)}
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {open ? <X className="h-6 w-6" /> : <D20Icon className="h-7 w-7" />}
        </motion.button>
      </div>
    </>
  )
}
