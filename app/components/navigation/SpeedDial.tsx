"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Dice6,
  Calculator,
  Swords,
  UserRound,
  BookOpen,
  X,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react"
import { useWidgets } from "@/app/components/widgets/WidgetProvider"
import type { WidgetId } from "@/app/components/widgets/widget-registry"

type Action = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  auth?: boolean
}

type WidgetAction = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  widgetId: WidgetId
}

const topActions: Action[] = [
  { label: "Create Guild", icon: Shield, href: "/guilds?create=true", auth: true },
]

const widgetActions: WidgetAction[] = [
  { label: "Dice Roller", icon: Dice6, widgetId: "dice" },
  { label: "Initiative", icon: Swords, widgetId: "initiative" },
  { label: "NPC Generator", icon: UserRound, widgetId: "npc" },
  { label: "Conditions", icon: BookOpen, widgetId: "conditions" },
  { label: "Quick Convert", icon: Calculator, widgetId: "calculator" },
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
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { openWidgets, toggleWidget, collapsed, toggleCollapsed } = useWidgets()
  const hasOpenWidgets = openWidgets.size > 0

  const visibleTopActions = topActions.filter(a => !a.auth || session?.user)

  function handleClose() {
    setOpen(false)
    setWidgetsOpen(false)
  }

  function handleTopAction(action: Action) {
    handleClose()
    if (action.href) router.push(action.href)
  }

  function handleWidgetAction(widgetId: WidgetId) {
    toggleWidget(widgetId)
    handleClose()
  }

  // Items to render: top actions + "Widgets" trigger
  // When widgetsOpen, widget sub-items appear between the Widgets trigger and the items above it

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1099] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <div className="speed-dial fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[1100] flex flex-col-reverse items-center gap-2">
        {/* Main trigger */}
        <motion.button
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors cursor-pointer corona-border corona-pulse ${open ? "corona-active" : ""}`}
          onClick={() => { if (open) handleClose(); else setOpen(true) }}
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
              {/* Widgets submenu trigger */}
              <motion.div
                variants={{
                  closed: { opacity: 0, y: 20, scale: 0.3 },
                  open: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ delay: 0, type: "spring", stiffness: 300, damping: 24 }}
              >
                <button
                  onClick={() => setWidgetsOpen(!widgetsOpen)}
                  className={`group relative flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-all cursor-pointer ${
                    widgetsOpen
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.3)]"
                  }`}
                >
                  <Layers className="h-5 w-5" />
                  {hasOpenWidgets && !widgetsOpen && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Widgets
                  </span>
                </button>
              </motion.div>

              {/* Widget sub-items */}
              <AnimatePresence>
                {widgetsOpen && (
                  <motion.div
                    className="flex flex-col-reverse items-center gap-2"
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    {widgetActions.map((wa, i) => {
                      const isActive = openWidgets.has(wa.widgetId)
                      return (
                        <motion.div
                          key={wa.widgetId}
                          variants={{
                            closed: { opacity: 0, y: 10, scale: 0.3 },
                            open: { opacity: 1, y: 0, scale: 1 },
                          }}
                          transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                        >
                          <button
                            onClick={() => handleWidgetAction(wa.widgetId)}
                            className={`group relative flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-all cursor-pointer ${
                              isActive
                                ? "bg-primary/20 border-primary/30 text-primary"
                                : "bg-card border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.3)]"
                            }`}
                          >
                            <wa.icon className="h-4 w-4" />
                            <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {wa.label}
                            </span>
                          </button>
                        </motion.div>
                      )
                    })}

                    {/* Collapse/expand toggle */}
                    <motion.div
                      variants={{
                        closed: { opacity: 0, y: 10, scale: 0.3 },
                        open: { opacity: 1, y: 0, scale: 1 },
                      }}
                      transition={{ delay: widgetActions.length * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <button
                        onClick={toggleCollapsed}
                        disabled={!hasOpenWidgets}
                        className={`group relative flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-md transition-all ${
                          hasOpenWidgets
                            ? "text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer"
                            : "text-muted-foreground/30 cursor-not-allowed"
                        }`}
                        aria-label={collapsed ? "Show widgets" : "Hide widgets"}
                      >
                        {collapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {collapsed ? "Show widgets" : "Hide widgets"}
                        </span>
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top-level actions */}
              {visibleTopActions.map((action, i) => (
                <motion.div
                  key={action.label}
                  variants={{
                    closed: { opacity: 0, y: 20, scale: 0.3 },
                    open: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ delay: (i + 1) * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                >
                  <button
                    onClick={() => handleTopAction(action)}
                    className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.3)] transition-all cursor-pointer"
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {action.label}
                    </span>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
