'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteGuild, updateGuild } from "@/lib/guilds"
import { createRole, updateRole, deleteRole } from "@/lib/roles"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
} from '@/components/ui/alert-dialog'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { AlertTriangle, Pencil, Trash2, Plus } from 'lucide-react'

function RoleEditor({ role, guildId, actorRole, onCancel }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(role?.name || '')
  const [color, setColor] = useState(role?.color || '#6b7280')
  const [manageMembers, setManageMembers] = useState(role?.manage_members || false)
  const [manageMaps, setManageMaps] = useState(role?.manage_maps || false)
  const [manageMarkers, setManageMarkers] = useState(role?.manage_markers || false)
  const [manageGuild, setManageGuild] = useState(role?.manage_guild || false)

  const isCreating = !role?.id

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        name: name.trim(),
        color,
        manage_members: manageMembers,
        manage_maps: manageMaps,
        manage_markers: manageMarkers,
        manage_guild: manageGuild,
      }
      if (isCreating) {
        return createRole(guildId, data)
      }
      return updateRole(guildId, role.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', 'roles', guildId] })
      queryClient.invalidateQueries({ queryKey: ['guild', 'members', guildId] })
      onCancel()
    },
  })

  // Actor cannot grant permissions they don't have themselves
  const canTogglePermission = (perm: string) => {
    return actorRole?.[perm] === true
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Role name"
          className="bg-white/[0.05] border-white/[0.08] flex-1"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-white/[0.08] bg-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          Manage Members
          <Switch
            checked={manageMembers}
            onCheckedChange={setManageMembers}
            disabled={!canTogglePermission('manage_members')}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          Manage Maps
          <Switch
            checked={manageMaps}
            onCheckedChange={setManageMaps}
            disabled={!canTogglePermission('manage_maps')}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          Manage Markers
          <Switch
            checked={manageMarkers}
            onCheckedChange={setManageMarkers}
            disabled={!canTogglePermission('manage_markers')}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          Manage Guild
          <Switch
            checked={manageGuild}
            onCheckedChange={setManageGuild}
            disabled={!canTogglePermission('manage_guild')}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={saveMutation.isPending || !name.trim()}
          onClick={() => saveMutation.mutate()}
          className="cursor-pointer"
        >
          {saveMutation.isPending ? 'Saving...' : isCreating ? 'Create' : 'Save'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function GuildSettings({ userId }) {
  const queryClient = useQueryClient()
  const { guildData, rolesData, hasPermission, getMemberRole } = useGuild()
  const router = useRouter()
  const [name, setName] = useState(guildData.name)
  const [description, setDescription] = useState(guildData.description || '')
  const [visibility, setVisibility] = useState(guildData.visibility || 'private')
  const [defaultRoleId, setDefaultRoleId] = useState(guildData.default_role_id?.toString() || '')
  const [requestExpiryDays, setRequestExpiryDays] = useState(guildData.request_expiry_days?.toString() || '7')
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  if (!hasPermission(userId, 'manage_guild')) router.push(`/guilds/${guildData.guild_id}`)

  const actorRole = getMemberRole(userId)
  const sortedRoles = [...(rolesData || [])].sort((a, b) => a.position - b.position)

  const { mutate: renameMutate, isPending: isRenaming } = useMutation({
    mutationFn: () => updateGuild(guildData.guild_id, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', guildData.guild_id] })
    },
  })

  const { mutate: deleteGuildMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onSuccess: () => {
      router.push('/guilds')
      queryClient.invalidateQueries({ queryKey: ['guilds'] })
      queryClient.invalidateQueries({ queryKey: ['guild', userId] })
    },
    onError: (err) => {
      console.error("Error deleting guild:", err)
    }
  })

  const visibilityMutation = useMutation({
    mutationFn: (val: string) => updateGuild(guildData.guild_id, { visibility: val } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guild', guildData.guild_id] }),
  })

  const descriptionMutation = useMutation({
    mutationFn: () => updateGuild(guildData.guild_id, { description: description.trim() } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guild', guildData.guild_id] }),
  })

  const defaultRoleMutation = useMutation({
    mutationFn: (roleId: string) => updateGuild(guildData.guild_id, { defaultRoleId: parseInt(roleId) } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guild', guildData.guild_id] }),
  })

  const expiryMutation = useMutation({
    mutationFn: (days: string) => updateGuild(guildData.guild_id, {
      requestExpiryDays: days ? parseInt(days) : null,
    } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guild', guildData.guild_id] }),
  })

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => deleteRole(guildData.guild_id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guild', 'roles', guildData.guild_id] })
      queryClient.invalidateQueries({ queryKey: ['guild', 'members', guildData.guild_id] })
    },
  })

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildData.guild_id)
  }

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === guildData.name) return
    renameMutate()
  }

  const canEditRole = (role) => {
    if (role.position === 0) return false
    if (!actorRole) return false
    return actorRole.position < role.position
  }

  const canDeleteRole = (role) => {
    if (role.is_system) return false
    if (!actorRole) return false
    return actorRole.position < role.position
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold font-cinzel">Settings</h1>

      <GlassPanel className="p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">General</h2>
          <form onSubmit={handleRename} className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="guild-name" className="text-sm text-muted-foreground">Guild Name</label>
              <Input
                id="guild-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.05] border-white/[0.08]"
              />
            </div>
            <Button
              type="submit"
              disabled={isRenaming || !name.trim() || name.trim() === guildData.name}
            >
              {isRenaming ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Membership</h2>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Public Guild</span>
              <span className="text-xs text-muted-foreground">
                Public guilds appear in the Discover page
              </span>
            </div>
            <Switch
              checked={visibility === 'public'}
              disabled={visibilityMutation.isPending}
              onCheckedChange={(checked) => {
                const val = checked ? 'public' : 'private'
                setVisibility(val)
                visibilityMutation.mutate(val)
              }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your guild..."
              className="bg-white/[0.05] border-white/[0.08] min-h-[80px]"
            />
            <Button
              size="sm"
              className="w-fit cursor-pointer"
              disabled={descriptionMutation.isPending || description.trim() === (guildData.description || '')}
              onClick={() => descriptionMutation.mutate()}
            >
              {descriptionMutation.isPending ? 'Saving...' : 'Save Description'}
            </Button>
          </div>

          {/* Default Join Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Default Join Role</label>
            <span className="text-xs text-muted-foreground">
              Role assigned to new members when join requests are approved
            </span>
            <Select
              value={defaultRoleId}
              disabled={defaultRoleMutation.isPending}
              onValueChange={(val) => {
                setDefaultRoleId(val)
                defaultRoleMutation.mutate(val)
              }}
            >
              <SelectTrigger className="bg-white/[0.05] border-white/[0.08] w-fit min-w-[200px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {sortedRoles.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Request Expiry */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Request Expiry (days)</label>
            <span className="text-xs text-muted-foreground">
              How long before pending join requests expire. Leave empty for no expiry.
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={requestExpiryDays}
                onChange={(e) => setRequestExpiryDays(e.target.value)}
                placeholder="No expiry"
                className="bg-white/[0.05] border-white/[0.08] w-32"
              />
              <Button
                size="sm"
                className="cursor-pointer"
                disabled={expiryMutation.isPending}
                onClick={() => expiryMutation.mutate(requestExpiryDays)}
              >
                {expiryMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Roles</h2>
            {!isCreatingRole && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 cursor-pointer"
                disabled={sortedRoles.length >= 10}
                onClick={() => {
                  setEditingRoleId(null)
                  setIsCreatingRole(true)
                }}
              >
                <Plus size={16} />
                Add Role
              </Button>
            )}
          </div>

          {isCreatingRole && (
            <RoleEditor
              role={null}
              guildId={guildData.guild_id}
              actorRole={actorRole}
              onCancel={() => setIsCreatingRole(false)}
            />
          )}

          <div className="flex flex-col gap-2">
            {sortedRoles.map((role) => (
              <div key={role.id}>
                {editingRoleId === role.id ? (
                  <RoleEditor
                    role={role}
                    guildId={guildData.guild_id}
                    actorRole={actorRole}
                    onCancel={() => setEditingRoleId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      {role.is_system && (
                        <span className="text-xs text-muted-foreground">(system)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 cursor-pointer"
                        disabled={!canEditRole(role)}
                        onClick={() => {
                          setIsCreatingRole(false)
                          setEditingRoleId(role.id)
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                        disabled={!canDeleteRole(role) || deleteRoleMutation.isPending}
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="border-destructive/30 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete this guild and all its data.
            </p>
          </div>
          <div>
            <AlertDialog onOpenChange={(open) => { if (!open) setDeleteConfirmName('') }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Guild</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {guildData.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All guild data including members, roles, maps, and markers will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground">
                    Type <span className="font-semibold text-foreground">{guildData.name}</span> to confirm
                  </label>
                  <Input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={guildData.name}
                    className="bg-white/[0.05] border-white/[0.08]"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmName !== guildData.name || isDeleting}
                    onClick={handleDeleteClick}
                  >
                    {isDeleting ? 'Deleting Guild...' : 'Delete Guild'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
