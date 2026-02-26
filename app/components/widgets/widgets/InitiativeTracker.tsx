"use client"

import { useState, useReducer, useRef, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dice6, Plus, SkipForward, SkipBack, X } from "lucide-react"

type Combatant = {
  id: number
  name: string
  initiative: number
}

type State = {
  combatants: Combatant[]
  currentTurn: number
  round: number
}

type Action =
  | { type: "add"; combatant: Combatant }
  | { type: "remove"; id: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "clear" }

function sortByInitiative(list: Combatant[]): Combatant[] {
  return [...list].sort((a, b) => b.initiative - a.initiative)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { ...state, combatants: [...state.combatants, action.combatant] }

    case "remove": {
      const next = state.combatants.filter((c) => c.id !== action.id)
      if (next.length === 0) return { combatants: [], currentTurn: 0, round: 1 }

      const sortedPrev = sortByInitiative(state.combatants)
      const sortedNext = sortByInitiative(next)
      const currentId = sortedPrev[state.currentTurn]?.id

      let newTurn: number
      if (currentId === action.id) {
        newTurn = state.currentTurn >= sortedNext.length ? 0 : state.currentTurn
      } else {
        const idx = sortedNext.findIndex((c) => c.id === currentId)
        newTurn = idx >= 0 ? idx : 0
      }
      return { ...state, combatants: next, currentTurn: newTurn }
    }

    case "next": {
      const sorted = sortByInitiative(state.combatants)
      if (sorted.length === 0) return state
      const next = state.currentTurn + 1
      if (next >= sorted.length) {
        return { ...state, currentTurn: 0, round: state.round + 1 }
      }
      return { ...state, currentTurn: next }
    }

    case "prev": {
      const sorted = sortByInitiative(state.combatants)
      if (sorted.length === 0) return state
      const next = state.currentTurn - 1
      if (next < 0) {
        return {
          ...state,
          currentTurn: sorted.length - 1,
          round: Math.max(1, state.round - 1),
        }
      }
      return { ...state, currentTurn: next }
    }

    case "clear":
      return { combatants: [], currentTurn: 0, round: 1 }
  }
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

const CombatantRow = memo(function CombatantRow({
  combatant,
  isActive,
  onRemove,
}: {
  combatant: Combatant
  isActive: boolean
  onRemove: (id: number) => void
}) {
  const handleRemove = useCallback(() => onRemove(combatant.id), [onRemove, combatant.id])
  return (
    <motion.div
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
        <div className="w-1.5 flex-shrink-0">
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--corona-rgb),0.6)]" />
          )}
        </div>
        <span className="flex-1 min-w-0 text-xs truncate">
          {combatant.name}
        </span>
        <span className="font-cinzel font-bold text-xs text-primary/70 w-6 text-right flex-shrink-0">
          {combatant.initiative}
        </span>
        <button
          onClick={handleRemove}
          aria-label={`Remove ${combatant.name}`}
          className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  )
})

export function InitiativeTrackerContent() {
  const [state, dispatch] = useReducer(reducer, {
    combatants: [],
    currentTurn: 0,
    round: 1,
  })
  const [name, setName] = useState("")
  const [initiative, setInitiative] = useState("")
  const idRef = useRef(0)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const sorted = sortByInitiative(state.combatants)

  const addCombatant = useCallback(
    (init: number) => {
      const trimmed = nameInputRef.current?.value.trim()
      if (!trimmed) return
      dispatch({ type: "add", combatant: { id: idRef.current++, name: trimmed, initiative: init } })
      setName("")
      setInitiative("")
      nameInputRef.current?.focus()
    },
    []
  )

  const addManual = useCallback(() => {
    const val = parseInt(initiative, 10)
    if (isNaN(val)) return
    addCombatant(val)
  }, [initiative, addCombatant])

  const addRandom = useCallback(() => {
    addCombatant(rollD20())
  }, [addCombatant])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addManual()
      }
    },
    [addManual]
  )

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleInitiativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInitiative(e.target.value)
  }, [])

  const handleRemove = useCallback((id: number) => {
    dispatch({ type: "remove", id })
  }, [])

  const handlePrev = useCallback(() => dispatch({ type: "prev" }), [])
  const handleNext = useCallback(() => dispatch({ type: "next" }), [])
  const handleClear = useCallback(() => dispatch({ type: "clear" }), [])

  return (
    <div className="px-3 pb-3 flex flex-col gap-2">
      {/* Add combatant form */}
      <div className="flex gap-1.5">
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Name"
          aria-label="Combatant name"
          value={name}
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        <input
          type="number"
          placeholder="Init"
          aria-label="Initiative value"
          value={initiative}
          onChange={handleInitiativeChange}
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
            sorted.map((c, i) => (
              <CombatantRow
                key={c.id}
                combatant={c}
                isActive={i === state.currentTurn}
                onRemove={handleRemove}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Turn controls */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
          <button
            onClick={handlePrev}
            aria-label="Previous turn"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <span className="text-[10px] text-muted-foreground/60 font-cinzel tracking-wider uppercase">
            Round {state.round}
          </span>

          <button
            onClick={handleNext}
            aria-label="Next turn"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Clear all */}
      {sorted.length > 0 && (
        <button
          onClick={handleClear}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer self-center"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
