'use client'

import { useState } from "react"
import { signOut } from "next-auth/react"
import { useUser } from "../../providers/UserProvider"
import { deleteUser } from "@/lib/users"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function AccountSettings({ userId }: { userId: string }) {
  const user = useUser()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

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
