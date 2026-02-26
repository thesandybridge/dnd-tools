"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Dice6, Calculator, Swords, UserRound, BookOpen, X } from "lucide-react"
import { useWidgets } from "@/app/components/widgets/WidgetProvider"
import type { WidgetId } from "@/app/components/widgets/widget-registry"

type Action = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: string
  auth?: boolean
}

const actions: Action[] = [
  { label: "Create Guild", icon: Shield, href: "/guilds?create=true", auth: true },
  { label: "Dice Roller", icon: Dice6, action: "dice" },
  { label: "Initiative", icon: Swords, action: "initiative" },
  { label: "NPC Generator", icon: UserRound, action: "npc" },
  { label: "Conditions", icon: BookOpen, action: "conditions" },
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
  const { data: session } = useSession()
  const router = useRouter()
  const { openWidgets, toggleWidget } = useWidgets()

  const visibleActions = actions.filter(a => !a.auth || session?.user)

  function handleAction(action: Action) {
    setOpen(false)
    if (action.action) {
      toggleWidget(action.action as WidgetId)
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1099] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[1100] flex flex-col-reverse items-center gap-2">
        <motion.button
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors cursor-pointer corona-border corona-pulse ${open ? "corona-active" : ""}`}
          onClick={() => setOpen(!open)}
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {open ? <X className="h-6 w-6" /> : <D20Icon className="h-7 w-7" />}
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col-reverse items-center gap-2"
              initial="closed"
              animate="open"
              exit="closed"
            >
              {visibleActions.map((action, i) => {
                const isWidgetAction = !!action.action
                const isActive = isWidgetAction && openWidgets.has(action.action as WidgetId)
                return (
                  <motion.div
                    key={action.label}
                    variants={{
                      closed: { opacity: 0, y: 20, scale: 0.3 },
                      open: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <button
                      onClick={() => handleAction(action)}
                      className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.3)] transition-all cursor-pointer"
                    >
                      <action.icon className="h-5 w-5" />
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {action.label}
                      </span>
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
