'use client'

import { useState } from "react"
import { signOut } from "next-auth/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "../../providers/UserProvider"
import { deleteUser, updateUser } from "@/lib/users"
import { validateTileForgeKey } from "@/lib/tileforge"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function AccountSettings({ userId }: { userId: string }) {
  const user = useUser()
  const queryClient = useQueryClient()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [timezone, setTimezone] = useState(user.timezone || 'UTC')
  const [tzSearch, setTzSearch] = useState('')
  const [tzOpen, setTzOpen] = useState(false)
  const [tfKey, setTfKey] = useState('')

  const timezones = typeof Intl !== 'undefined' && Intl.supportedValuesOf
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC']

  const filteredTimezones = tzSearch
    ? timezones.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase()))
    : timezones

  const timezoneMutation = useMutation({
    mutationFn: (tz: string) => updateUser(userId, { timezone: tz }),
  })

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz)
    setTzOpen(false)
    setTzSearch('')
    timezoneMutation.mutate(tz)
  }

  const tfConnectMutation = useMutation({
    mutationFn: async () => {
      await validateTileForgeKey(tfKey)
      return updateUser(userId, { tileforgeApiKey: tfKey })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      setTfKey('')
    },
  })

  const tfDisconnectMutation = useMutation({
    mutationFn: () => updateUser(userId, { tileforgeApiKey: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
  })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(userId)
      await signOut({ callbackUrl: '/' })
    } catch {
      setDeleting(false)
    }
  }

  return (
    <GlassPanel className="p-6 flex flex-col gap-4">
      <h3 className="font-cinzel font-semibold">Account</h3>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Email</span>
        <span className="text-sm">{user.email || 'Not available'}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Connected Account</span>
        <span className="text-sm">Discord</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Timezone</span>
        <Popover open={tzOpen} onOpenChange={setTzOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-fit justify-start font-normal">
              {timezone}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <Input
              placeholder="Search timezones..."
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredTimezones.map(tz => (
                <button
                  key={tz}
                  onClick={() => handleTimezoneChange(tz)}
                  className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-accent transition-colors ${tz === timezone ? 'bg-accent font-medium' : ''}`}
                >
                  {tz.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {timezoneMutation.isPending && <span className="text-xs text-muted-foreground">Saving...</span>}
      </div>

      <GlassPanel variant="subtle" className="p-5">
        <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">TileForge</h3>
        {user.tileforge_api_key ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-400">Connected</span>
              <span className="text-xs text-muted-foreground font-mono">
                {user.tileforge_api_key.slice(0, 10)}...
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={tfDisconnectMutation.isPending}
              onClick={() => tfDisconnectMutation.mutate()}
            >
              {tfDisconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connect your TileForge account to import tilesets when creating maps.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="tf_..."
                value={tfKey}
                onChange={(e) => setTfKey(e.target.value)}
                className="max-w-xs"
              />
              <Button
                size="sm"
                disabled={!tfKey.startsWith('tf_') || tfConnectMutation.isPending}
                onClick={() => tfConnectMutation.mutate()}
              >
                {tfConnectMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
            {tfConnectMutation.isError && (
              <p className="text-sm text-destructive">
                {tfConnectMutation.error instanceof Error
                  ? tfConnectMutation.error.message
                  : 'Failed to connect'}
              </p>
            )}
          </div>
        )}
      </GlassPanel>

      <div className="border-t border-destructive/20 pt-4 mt-2">
        <h4 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Deleting your account will transfer guild ownership where possible, delete empty guilds, and remove all your characters.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your guilds will be transferred or deleted,
                and all characters will be permanently removed.
                Type <strong>DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="my-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </GlassPanel>
  )
}
