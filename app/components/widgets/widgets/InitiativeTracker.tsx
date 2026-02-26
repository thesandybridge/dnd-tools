"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dice6, Plus, SkipForward, SkipBack, X } from "lucide-react"

type Combatant = {
  id: number
  name: string
  initiative: number
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export function InitiativeTrackerContent() {
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [name, setName] = useState("")
  const [initiative, setInitiative] = useState("")
  const [currentTurn, setCurrentTurn] = useState(0)
  const [round, setRound] = useState(1)
  const idRef = useRef(0)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative)

  const addCombatant = useCallback(
    (init: number) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setCombatants((prev) => [
        ...prev,
        { id: idRef.current++, name: trimmed, initiative: init },
      ])
      setName("")
      setInitiative("")
      nameInputRef.current?.focus()
    },
    [name]
  )

  const addManual = useCallback(() => {
    const val = parseInt(initiative, 10)
    if (isNaN(val)) return
    addCombatant(val)
  }, [initiative, addCombatant])

  const addRandom = useCallback(() => {
    addCombatant(rollD20())
  }, [addCombatant])

  const removeCombatant = useCallback(
    (id: number) => {
      setCombatants((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (next.length === 0) {
          setCurrentTurn(0)
          setRound(1)
        } else {
          // Adjust currentTurn if needed
          const sortedPrev = [...prev].sort((a, b) => b.initiative - a.initiative)
          const sortedNext = [...next].sort((a, b) => b.initiative - a.initiative)
          const currentId = sortedPrev[currentTurn]?.id
          if (currentId === id) {
            // Removed the active combatant — stay at same index or wrap
            setCurrentTurn((t) => (t >= sortedNext.length ? 0 : t))
          } else {
            // Find where the current combatant ended up
            const newIndex = sortedNext.findIndex((c) => c.id === currentId)
            if (newIndex >= 0) setCurrentTurn(newIndex)
            else setCurrentTurn(0)
          }
        }
        return next
      })
    },
    [currentTurn]
  )

  const nextTurn = useCallback(() => {
    if (sorted.length === 0) return
    setCurrentTurn((prev) => {
      const next = prev + 1
      if (next >= sorted.length) {
        setRound((r) => r + 1)
        return 0
      }
      return next
    })
  }, [sorted.length])

  const prevTurn = useCallback(() => {
    if (sorted.length === 0) return
    setCurrentTurn((prev) => {
      const next = prev - 1
      if (next < 0) {
        setRound((r) => Math.max(1, r - 1))
        return sorted.length - 1
      }
      return next
    })
  }, [sorted.length])

  const clearAll = useCallback(() => {
    setCombatants([])
    setCurrentTurn(0)
    setRound(1)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addManual()
      }
    },
    [addManual]
  )

  return (
    <div className="px-3 pb-3 flex flex-col gap-2">
      {/* Add combatant form */}
      <div className="flex gap-1.5">
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        <input
          type="number"
          placeholder="Init"
          value={initiative}
          onChange={(e) => setInitiative(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-14 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={addRandom}
          title="Roll d20 for initiative"
          className="h-[30px] w-[30px] flex-shrink-0 flex items-center justify-center rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
        >
          <Dice6 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={addManual}
          title="Add with manual initiative"
          className="h-[30px] w-[30px] flex-shrink-0 flex items-center justify-center rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Combatant list */}
      <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {sorted.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-muted-foreground/50 text-center py-4"
            >
              Add combatants to begin
            </motion.p>
          ) : (
            sorted.map((c, i) => {
              const isActive = i === currentTurn
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "border border-transparent"
                    }`}
                  >
                    {/* Turn indicator dot */}
                    <div className="w-1.5 flex-shrink-0">
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--corona-rgb),0.6)]" />
                      )}
                    </div>

                    {/* Name */}
                    <span className="flex-1 min-w-0 text-xs truncate">
                      {c.name}
                    </span>

                    {/* Initiative value */}
                    <span className="font-cinzel font-bold text-xs text-primary/70 w-6 text-right flex-shrink-0">
                      {c.initiative}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={() => removeCombatant(c.id)}
                      className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Turn controls */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
          <button
            onClick={prevTurn}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <span className="text-[10px] text-muted-foreground/60 font-cinzel tracking-wider uppercase">
            Round {round}
          </span>

          <button
            onClick={nextTurn}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Clear all */}
      {sorted.length > 0 && (
        <button
          onClick={clearAll}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer self-center"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
