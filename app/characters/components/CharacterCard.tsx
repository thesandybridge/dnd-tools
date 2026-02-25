'use client'

import Link from "next/link"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Badge } from "@/components/ui/badge"

interface CharacterCardProps {
  character: {
    id: number
    name: string
    race: string | null
    char_class: string | null
    level: number
  }
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link href={`/characters/${character.id}`}>
      <GlassPanel coronaHover className="p-4 flex flex-col gap-2 hover:bg-white/[0.03] transition-colors min-h-[140px]">
        <h3 className="font-cinzel font-semibold truncate">{character.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {[character.race, character.char_class].filter(Boolean).join(' ') || 'Unknown origin'}
        </p>
        <Badge variant="outline" className="w-fit mt-auto">Lvl {character.level}</Badge>
      </GlassPanel>
    </Link>
  )
}
