'use client'

import { useGuild } from "../providers/GuildProvider"
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import useDeleteMemberMutation from '../../hooks/useDeleteMemberMutation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function GuildMembers({ userId }) {
  const { guildData, membersData, isAdminOrOwner } = useGuild()

  const { mutation } = useDeleteMemberMutation(guildData)
  const { mutate: deleteMemberMutate, isPending: isDeleting, error } = mutation

  const columnHelper = createColumnHelper()

  const handleDeleteClick = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation()
    e.preventDefault()
    deleteMemberMutate(memberId)
  }

  const columns = [
    columnHelper.accessor('users.name', {
      header: 'Member Name',
      cell: (info) => (
        <div className="p-3 flex-1 flex">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => {
        const role = info.getValue()
        const variant = role === 'owner' ? 'default' : 'secondary'
        return (
          <div className="p-3 flex-1 flex">
            <Badge variant={variant} className="capitalize">{role}</Badge>
          </div>
        )
      },
    }),
    ...(isAdminOrOwner(userId) ? [
      columnHelper.display({
        header: 'Actions',
        cell: ({ row }) => (
          <div className="p-3 flex-1 flex">
            <Button
              onClick={(e) => handleDeleteClick(e, row.original.user_id)}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
            >
              {isDeleting ? 'Deleting...' : 'Remove'}
            </Button>
          </div>
        ),
      }),
    ] : [])
  ]

  const table = useReactTable({
    data: membersData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isDeleting) return <p className="text-muted-foreground text-center py-8">Loading...</p>
  if (error) return <p className="text-destructive text-center py-8">Error: {error.message}</p>

  return (
    <div className="flex w-full flex-col rounded-lg border border-border overflow-hidden">
      <div className="flex w-full border-b border-border bg-muted/50">
        {table.getHeaderGroups().map(headerGroup => (
          <div className="flex w-full" key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <div className="p-3 flex-1 font-semibold text-sm text-foreground" key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col">
        {table.getRowModel().rows.map(row => (
          <div className="flex w-full border-b border-border last:border-0 hover:bg-muted/30 transition-colors" key={row.id}>
            {row.getVisibleCells().map(cell => (
              <div className="flex-1" key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
