"use client"

import { DICE_CONFIG, type DieType } from "./utils"

type DiceSelectorProps = {
  selected: DieType
  onSelect: (type: DieType) => void
}

const dieTypes = Object.keys(DICE_CONFIG) as DieType[]

export default function DiceSelector({ selected, onSelect }: DiceSelectorProps) {
  return (
    <div className="flex gap-1.5 justify-center">
      {dieTypes.map(type => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`
            min-w-[3rem] px-3 py-1.5 rounded-full font-cinzel text-sm font-bold
            transition-all duration-200 cursor-pointer
            ${type === selected
              ? "bg-primary/25 text-primary border border-primary/40 shadow-[0_0_12px_rgba(200,164,78,0.2)]"
              : "text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20"
            }
          `}
        >
          {DICE_CONFIG[type].label}
        </button>
      ))}
    </div>
  )
}
