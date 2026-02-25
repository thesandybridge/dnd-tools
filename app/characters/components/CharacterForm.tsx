'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { preventNonNumeric, handleFocus } from "@/app/tools/components/calculator/helper"

interface CharacterFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; race?: string; charClass?: string; subclass?: string; level?: number; backstory?: string }) => void
  isSubmitting?: boolean
  character?: {
    name: string
    race: string | null
    char_class: string | null
    subclass: string | null
    level: number
    backstory: string | null
  }
}

export default function CharacterForm({ open, onClose, onSubmit, isSubmitting, character }: CharacterFormProps) {
  const [name, setName] = useState(character?.name || '')
  const [race, setRace] = useState(character?.race || '')
  const [charClass, setCharClass] = useState(character?.char_class || '')
  const [subclass, setSubclass] = useState(character?.subclass || '')
  const [level, setLevel] = useState(character?.level || 1)
  const [backstory, setBackstory] = useState(character?.backstory || '')

  useEffect(() => {
    if (open && character) {
      setName(character.name)
      setRace(character.race || '')
      setCharClass(character.char_class || '')
      setSubclass(character.subclass || '')
      setLevel(character.level)
      setBackstory(character.backstory || '')
    } else if (open && !character) {
      setName(''); setRace(''); setCharClass(''); setSubclass(''); setLevel(1); setBackstory('')
    }
  }, [open, character])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      race: race.trim() || undefined,
      charClass: charClass.trim() || undefined,
      subclass: subclass.trim() || undefined,
      level,
      backstory: backstory.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel">{character ? 'Edit Character' : 'Create Character'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Race</Label>
            <Input value={race} onChange={(e) => setRace(e.target.value)} placeholder="e.g. Half-Elf" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Class</Label>
            <Input value={charClass} onChange={(e) => setCharClass(e.target.value)} placeholder="e.g. Wizard" />
          </div>
          {charClass && (
            <div className="flex flex-col gap-1.5">
              <Label>Subclass</Label>
              <Input value={subclass} onChange={(e) => setSubclass(e.target.value)} placeholder="e.g. School of Evocation" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Level</Label>
            <Input type="number" value={level} min={1} max={20}
              onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
              onKeyDown={preventNonNumeric} onFocus={handleFocus} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Backstory</Label>
            <Textarea value={backstory} onChange={(e) => setBackstory(e.target.value)}
              placeholder="A brief backstory for your character..." rows={4} />
          </div>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Saving...' : character ? 'Save Changes' : 'Create Character'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
