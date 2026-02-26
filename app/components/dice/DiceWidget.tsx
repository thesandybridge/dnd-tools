"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useTheme } from "@/app/providers/ThemeProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { DICE_CONFIG, type DieType } from "./utils"

const WireframeDie = dynamic(() => import("./WireframeDie"), { ssr: false })

type RollEntry = {
  id: number
  dieType: DieType
  result: number
  timestamp: number
}

function rollDie(type: DieType): number {
  return Math.floor(Math.random() * DICE_CONFIG[type].faces) + 1
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}

const DIE_TYPES = Object.keys(DICE_CONFIG) as DieType[]

export default function DiceWidget({ onClose }: { onClose: () => void }) {
  const [dieType, setDieType] = useState<DieType>("d20")
  const [history, setHistory] = useState<RollEntry[]>([])
  const [rolling, setRolling] = useState(false)
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { theme } = useTheme()

  const doRoll = useCallback((type: DieType) => {
    setRolling(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const result = rollDie(type)
      setHistory(prev => [
        { id: idRef.current++, dieType: type, result, timestamp: Date.now() },
        ...prev,
      ].slice(0, 20))
      setRolling(false)
    }, 350)
  }, [])

  const roll = useCallback(() => doRoll(dieType), [dieType, doRoll])

  const switchDie = useCallback((type: DieType) => {
    setDieType(type)
    doRoll(type)
  }, [doRoll])

  // Auto-roll on mount
  useEffect(() => {
    doRoll("d20")
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [doRoll])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const latest = history[0]

  return (
    <motion.div
      className="fixed z-[1098] bottom-36 inset-x-4 mx-auto max-w-[280px] md:bottom-24 md:inset-x-auto md:right-6 md:mx-0"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative">
        {/* Wireframe die floating above the card */}
        <div className="absolute -top-[128px] left-1/2 -translate-x-1/2 pointer-events-none">
          <WireframeDie dieType={dieType} spinning={rolling} color={theme.primaryColor} />
        </div>

        <GlassPanel variant="strong" corona className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="font-cinzel text-[11px] tracking-widest text-muted-foreground uppercase">
              Dice Roller
            </span>
            <button
              onClick={onClose}
              className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Roll area - tap to roll */}
          <button
            onClick={roll}
            disabled={rolling}
            className="w-full flex flex-col items-center py-3 cursor-pointer group disabled:cursor-wait"
          >
            <div className="h-16 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {rolling ? (
                  <motion.span
                    key="rolling"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    className="font-cinzel text-3xl text-muted-foreground"
                  >
                    &middot;&middot;&middot;
                  </motion.span>
                ) : latest ? (
                  <motion.span
                    key={latest.id}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="font-cinzel text-5xl font-bold text-primary drop-shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  >
                    {latest.result}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground/60 transition-colors">
              {rolling ? "Rolling..." : "Tap to roll"}
            </span>
          </button>

          {/* Die type selector */}
          <div className="flex gap-1 justify-center px-3 pb-3">
            {DIE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => switchDie(type)}
                disabled={rolling}
                className={`
                  px-2 py-1 rounded-full font-cinzel text-[11px] font-bold transition-all cursor-pointer
                  ${type === dieType
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground border border-transparent hover:text-foreground hover:border-white/10"
                  }
                `}
              >
                {DICE_CONFIG[type].label}
              </button>
            ))}
          </div>

          {/* History */}
          <AnimatePresence>
            {history.length > 1 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="border-t border-white/[0.06] px-4 py-2 max-h-28 overflow-y-auto"
              >
                {history.slice(1, 11).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between py-0.5 text-[11px] text-muted-foreground">
                    <span>
                      <span className="font-cinzel font-bold">{DICE_CONFIG[entry.dieType].label}</span>
                      <span className="mx-1.5 text-white/20">&rarr;</span>
                      <span className="text-foreground/80">{entry.result}</span>
                    </span>
                    <span className="text-white/30">{timeAgo(entry.timestamp)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </motion.div>
  )
}
