'use client'

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "../../providers/UserProvider"
import { updateUser } from "@/lib/users"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ProfileSettings({ userId }: { userId: string }) {
  const user = useUser()
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name || '')
  const [bio, setBio] = useState(user.bio || '')

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
    },
  })

  const handleSave = () => {
    mutation.mutate({ name: name.trim(), bio: bio.trim() })
  }

  const hasChanges = name !== (user.name || '') || bio !== (user.bio || '')

  return (
    <GlassPanel className="p-6 flex flex-col gap-4">
      <h3 className="font-cinzel font-semibold">Profile</h3>
      <div className="flex items-center gap-4">
        {user.image && (
          <Image src={user.image} alt={user.name || 'Avatar'} width={64} height={64}
            className="rounded-lg border border-white/10" />
        )}
        <p className="text-sm text-muted-foreground">Avatar synced from your connected account</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Display Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className="max-w-sm" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280}
          placeholder="Tell us about yourself..." rows={3} className="max-w-lg" />
        <span className="text-xs text-muted-foreground">{bio.length}/280</span>
      </div>
      <Button onClick={handleSave} disabled={!hasChanges || mutation.isPending} className="w-fit">
        {mutation.isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </GlassPanel>
  )
}
