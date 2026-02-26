"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/app/providers/ThemeProvider"
import { DICE_CONFIG, type DieType } from "@/app/components/dice/utils"

const WireframeDie = dynamic(() => import("@/app/components/dice/WireframeDie"), { ssr: false })

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

export function DiceWidgetContent() {
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

  const latest = history[0]

  return (
    <div>
      {/* Roll area - tap to roll */}
      <button
        onClick={roll}
        disabled={rolling}
        className="w-full flex items-center justify-center py-4 cursor-pointer group disabled:cursor-wait relative"
      >
        {/* Stacked layers: die behind, number in front */}
        <div className="grid place-items-center [&>*]:[grid-area:1/1] h-[120px] w-full">
          <div className="h-[120px] w-[120px] pointer-events-none opacity-40 flex items-center justify-center overflow-visible">
            <div className="shrink-0">
              <WireframeDie dieType={dieType} spinning={rolling} color={theme.primaryColor} />
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <AnimatePresence mode="wait">
              {rolling ? (
                <motion.span
                  key="rolling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="font-cinzel text-2xl text-muted-foreground"
                >
                  &middot;&middot;&middot;
                </motion.span>
              ) : latest ? (
                <motion.span
                  key={latest.id}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="font-cinzel text-4xl font-bold text-primary drop-shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                >
                  {latest.result}
                </motion.span>
              ) : null}
            </AnimatePresence>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground/60 transition-colors mt-1">
              {rolling ? "Rolling..." : "Tap to roll"}
            </span>
          </div>
        </div>
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
    </div>
  )
}
