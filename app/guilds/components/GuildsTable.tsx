'use client'

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { fetchGuilds, deleteGuild } from "@/lib/guilds"
import { fetchGuildsByUser } from "@/lib/users"
import OwnerChip from './OwnerChip'
import { Button } from '@/components/ui/button'

export default function GuildsTable({ userId, isUserProfile = false }) {
  const queryClient = useQueryClient()

  const GUILDS_KEY = isUserProfile ? ['userGuilds', userId] : ['guilds', userId]

  const { data, error, isLoading } = useQuery({
    queryKey: GUILDS_KEY,
    queryFn: () => (isUserProfile ? fetchGuildsByUser(userId) : fetchGuilds()),
    refetchOnWindowFocus: false
  })

  const { mutate: deleteGuildMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onMutate: async (guildId) => {
      await queryClient.cancelQueries({ queryKey: GUILDS_KEY })

      const previousGuilds = queryClient.getQueryData(GUILDS_KEY)

      queryClient.setQueryData(GUILDS_KEY, (oldGuilds: unknown[]) =>
        oldGuilds?.filter((guild: { id: string }) => guild.id !== guildId) || []
      )

      return { previousGuilds }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(GUILDS_KEY, context?.previousGuilds)
      console.error("Failed to delete guild:", err.message)
      alert("Failed to delete the guild. Please try again.")
    },
  })

  const columnHelper = createColumnHelper()

  const handleDeleteClick = (e: React.MouseEvent, guildId: string) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildId)
  }

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <Link className="p-3 flex-1 flex hover:text-primary transition-colors" href={`/guilds/${info.row.original.guild_id}`}>
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('owner.name', {
      header: 'Owner',
      cell: (info) => {
        const isOwner = info.row.original.owner === userId
        return <OwnerChip
          userId={info.row.original.owner}
          isOwner={isOwner}
          className="p-3 flex-1 flex"
        />
      },
    }),
    ...(isUserProfile ? [
      columnHelper.display({
        header: 'Actions',
        cell: ({ row }) => (
          <div className="p-3 flex-1 flex">
            <Button
              onClick={(e) => handleDeleteClick(e, row.original.id)}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        ),
      }),
    ] : [])
  ]

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>
  if (error) return <p className="text-destructive text-center py-8">Error: {error.message}</p>

  return (
    <div className="flex w-full flex-col rounded-lg border border-border overflow-hidden">
      <div className="flex w-full border-b border-border bg-muted/50">
        {table.getHeaderGroups().map(headerGroup => (
          <div className="flex w-full" key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <div className="p-3 flex-1 font-semibold text-sm text-foreground" key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
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
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
