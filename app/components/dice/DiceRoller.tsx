"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw } from "lucide-react"
import DiceScene from "./DiceScene"
import DiceSelector from "./DiceSelector"
import { DICE_CONFIG, type DieType } from "./utils"

type DiceRollerProps = {
  onClose: () => void
}

export default function DiceRoller({ onClose }: DiceRollerProps) {
  const [dieType, setDieType] = useState<DieType>("d20")
  const [rollKey, setRollKey] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [rolling, setRolling] = useState(true)

  // Read theme colors from CSS variables
  const themeColors = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      primary: style.getPropertyValue("--primary").trim() || "#c8a44e",
      foreground: style.getPropertyValue("--primary-foreground").trim() || "#1a1814",
    }
  }, [])

  const handleResult = useCallback((value: number) => {
    setResult(value)
    setRolling(false)
  }, [])

  function rollAgain() {
    setResult(null)
    setRolling(true)
    setRollKey(k => k + 1)
  }

  function switchDie(type: DieType) {
    setDieType(type)
    setResult(null)
    setRolling(true)
    setRollKey(k => k + 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop with vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.92) 70%, rgba(0,0,0,0.97) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-6">
          {/* Die type label */}
          <div className="w-20">
            <AnimatePresence mode="wait">
              <motion.span
                key={dieType}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="font-cinzel text-sm text-white/40 tracking-widest uppercase"
              >
                {DICE_CONFIG[dieType].label}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Result display */}
          <AnimatePresence mode="wait">
            {result !== null && (
              <motion.div
                key={`${dieType}-${result}`}
                initial={{ opacity: 0, scale: 0.3, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <span className="font-cinzel text-7xl font-bold text-primary drop-shadow-[0_0_20px_rgba(200,164,78,0.5)]">
                  {result}
                </span>
              </motion.div>
            )}
            {rolling && (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <span className="font-cinzel text-lg text-white/30 tracking-widest animate-pulse">
                  Rolling...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button */}
          <div className="w-20 flex justify-end">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 3D Scene */}
        <div className="flex-1 min-h-0">
          <DiceScene dieType={dieType} rollKey={rollKey} onResult={handleResult} dieColor={themeColors.primary} numberColor={themeColors.foreground} />
        </div>

        {/* Bottom controls */}
        <div className="p-4 pb-8 flex flex-col items-center gap-4">
          <AnimatePresence>
            {!rolling && result !== null && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={rollAgain}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-cinzel text-sm hover:bg-primary/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Roll Again
              </motion.button>
            )}
          </AnimatePresence>
          <DiceSelector selected={dieType} onSelect={switchDie} />
        </div>
      </div>
    </motion.div>
  )
}
