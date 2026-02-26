"use client"

import { useState, useCallback } from "react"
import { Sparkles, RefreshCw, Copy } from "lucide-react"
import { RACES, FIRST_NAMES, OCCUPATIONS, QUIRKS, pickRandom } from "./npc-tables"

type NPC = {
  race: string
  name: string
  occupation: string
  quirk: string
}

type Field = keyof NPC

function generateNPC(): NPC {
  const race = pickRandom(RACES)
  return {
    race,
    name: pickRandom(FIRST_NAMES[race]),
    occupation: pickRandom(OCCUPATIONS),
    quirk: pickRandom(QUIRKS),
  }
}

const FIELD_LABELS: Record<Field, string> = {
  race: "Race",
  name: "Name",
  occupation: "Occupation",
  quirk: "Quirk",
}

const FIELDS: Field[] = ["race", "name", "occupation", "quirk"]

export function NPCGeneratorContent() {
  const [npc, setNpc] = useState<NPC | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    setNpc(generateNPC())
    setCopied(false)
  }, [])

  const reroll = useCallback((field: Field) => {
    setNpc(prev => {
      if (!prev) return prev
      if (field === "race") {
        const race = pickRandom(RACES)
        return { ...prev, race, name: pickRandom(FIRST_NAMES[race]) }
      }
      if (field === "name") {
        return { ...prev, name: pickRandom(FIRST_NAMES[prev.race]) }
      }
      if (field === "occupation") {
        return { ...prev, occupation: pickRandom(OCCUPATIONS) }
      }
      return { ...prev, quirk: pickRandom(QUIRKS) }
    })
    setCopied(false)
  }, [])

  const copy = useCallback(() => {
    if (!npc) return
    const text = `${npc.name} — ${npc.race} ${npc.occupation}. ${npc.quirk}.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [npc])

  return (
    <div className="px-3 pb-3">
      <button
        onClick={generate}
        className="bg-primary/20 text-primary hover:bg-primary/30 w-full rounded-md py-2 text-xs font-cinzel transition-colors cursor-pointer"
      >
        Generate
      </button>

      {npc ? (
        <div className="mt-3">
          {FIELDS.map(field => (
            <button
              key={field}
              onClick={() => reroll(field)}
              className="group flex items-center justify-between w-full text-left py-2 border-b border-white/[0.06] last:border-0 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {FIELD_LABELS[field]}
                </div>
                <div className="text-sm text-foreground truncate">{npc[field]}</div>
              </div>
              <RefreshCw className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
            </button>
          ))}

          <button
            onClick={copy}
            className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs">Generate an NPC</span>
        </div>
      )}
    </div>
  )
}
