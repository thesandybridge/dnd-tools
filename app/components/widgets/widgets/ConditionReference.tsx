"use client"

import { useState, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronRight } from "lucide-react"
import { CONDITIONS } from "./conditions-data"

type Condition = (typeof CONDITIONS)[number]

const ConditionItem = memo(function ConditionItem({
  condition,
  isOpen,
  onToggle,
}: {
  condition: Condition
  isOpen: boolean
  onToggle: (name: string) => void
}) {
  const handleClick = useCallback(() => onToggle(condition.name), [onToggle, condition.name])
  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        </motion.span>
        <span>{condition.name}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 text-[11px] text-muted-foreground">
              <p className="mb-1">{condition.description}</p>
              {condition.bullets.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {condition.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export function ConditionReferenceContent() {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(
    () => CONDITIONS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  const toggle = useCallback((name: string) => {
    setExpanded((prev) => (prev === name ? null : name))
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  return (
    <div className="px-3 pb-3 flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Search conditions..."
          aria-label="Search conditions"
          value={search}
          onChange={handleSearchChange}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 pl-7 text-xs w-full text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Condition list */}
      <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 text-center py-4">
            No conditions found
          </p>
        ) : (
          filtered.map((condition) => (
            <ConditionItem
              key={condition.name}
              condition={condition}
              isOpen={expanded === condition.name}
              onToggle={toggle}
            />
          ))
        )}
      </div>
    </div>
  )
}
