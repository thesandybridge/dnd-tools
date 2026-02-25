'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { fetchCharacters, createCharacter } from "@/lib/characters"
import CharacterCard from "./components/CharacterCard"
import CharacterForm from "./components/CharacterForm"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Plus } from "lucide-react"
import { useState } from "react"

export default function Characters() {
  const { data: session, status } = useSession()
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  if (status === "unauthenticated") redirect("/")

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    enabled: !!session?.user,
  })

  const createMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      setShowForm(false)
    },
  })

  if (status === "loading" || isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading characters...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-cinzel text-2xl font-semibold">Characters</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char: { id: number; name: string; race: string | null; char_class: string | null; level: number }) => (
          <CharacterCard key={char.id} character={char} />
        ))}
        <GlassPanel
          coronaHover
          className="p-6 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px] hover:bg-white/[0.03] transition-colors"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Create Character</span>
        </GlassPanel>
      </div>
      <CharacterForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
