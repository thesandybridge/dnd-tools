'use client'

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import { fetchCharacter, updateCharacter, deleteCharacter } from "@/lib/characters"
import CharacterForm from "../components/CharacterForm"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"

export default function CharacterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)

  if (status === "unauthenticated") redirect("/")

  const { data: character, isLoading } = useQuery({
    queryKey: ['character', id],
    queryFn: () => fetchCharacter(parseInt(id, 10)),
    enabled: !!session?.user,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateCharacter(parseInt(id, 10), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', id] })
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      setShowEdit(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCharacter(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      router.push('/characters')
    },
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <GlassPanel className="p-6 flex flex-col gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </GlassPanel>
        <GlassPanel variant="subtle" className="p-6 flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </GlassPanel>
      </div>
    )
  }

  if (!character) return <p className="text-sm text-muted-foreground p-6">Character not found</p>

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <GlassPanel corona className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-cinzel text-2xl font-semibold">{character.name}</h1>
            <p className="text-muted-foreground mt-1">
              {[character.race, character.char_class, character.subclass].filter(Boolean).join(' \u00b7 ') || 'Unknown origin'}
            </p>
            <Badge variant="outline" className="mt-2">Level {character.level}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {character.name}?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </GlassPanel>

      {/* Tab nav placeholder for Wave 2 */}
      <nav className="flex gap-1">
        <GlassPanel corona className="px-4 py-2 text-sm font-medium">Overview</GlassPanel>
      </nav>

      {/* Backstory */}
      {character.backstory ? (
        <GlassPanel variant="subtle" className="p-6">
          <h2 className="font-cinzel font-semibold mb-3">Backstory</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
        </GlassPanel>
      ) : (
        <GlassPanel variant="subtle" className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No backstory yet. Click edit to add one.</p>
        </GlassPanel>
      )}

      <CharacterForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
        character={character}
      />
    </div>
  )
}
