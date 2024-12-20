'use client'

import Link from 'next/link'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { fetchGuilds, deleteGuild } from "@/lib/guilds"
import { fetchGuildsByUser } from "@/lib/users"

import styles from "./guilds.module.css"

export default function GuildsTable({ userId, isUserProfile = false }) {
  const queryClient = useQueryClient()

  const GUILDS_KEY = isUserProfile ? ['userGuilds', userId] : ['guilds', userId]

  const { data, error, isLoading } = useQuery({
    queryKey: GUILDS_KEY,
    queryFn: () => (isUserProfile ? fetchGuildsByUser(userId) : fetchGuilds()),
    refetchOnWindowFocus: false
  })

  const { mutate: deleteGuildMutate, isLoading: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onMutate: async (guildId) => {
      await queryClient.cancelQueries(GUILDS_KEY)

      const previousGuilds = queryClient.getQueryData(GUILDS_KEY)

      queryClient.setQueryData(GUILDS_KEY, oldGuilds =>
        oldGuilds?.filter(guild => guild.id !== guildId) || []
      )

      return { previousGuilds }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(GUILDS_KEY, context.previousGuilds)
      console.error("Failed to delete guild:", err.message)
      alert("Failed to delete the guild. Please try again.")
    },
  })

  const columnHelper = createColumnHelper()

  const handleDeleteClick = (e, guildId) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildId)
  }

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <Link className={styles.tableData} href={`/guilds/${info.row.original.guild_id}`}>
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('owner.name', {
      header: 'Owner',
      cell: info => {
        const isOwner = info.row.original.owner.id === userId
        return isOwner ? (
          <Link
            href={`/users/${userId}`}
            className={`${styles.currentUser} ${styles.tableData}`}>
            {info.getValue()}
          </Link>
        ) : (
          <span className={styles.tableData}>{info.getValue()}</span>
        )
      },
    }),
    ...(isUserProfile ? [
      columnHelper.display({
        header: 'Actions',
        cell: ({ row }) => (
          <div
            className={styles.tableData}
          >
            <button
              onClick={(e) => handleDeleteClick(e, row.original.id)} // Handle delete click
              disabled={isDeleting}
              className={`guild-btn ${styles.guildActionBtns}`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
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

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div className={`${styles.table} ${isUserProfile ? styles.userProfile : ''}`}>
      <div className={styles.tableHead}>
        {table.getHeaderGroups().map(headerGroup => (
          <div className={styles.tableRow} key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <div className={styles.tableHeader} key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.tableBody}>
        {table.getRowModel().rows.map(row => (
          <div className={styles.tableRow} key={row.id}>
            {row.getVisibleCells().map(cell => (
              <div className={styles.dataWrapper} key={cell.id}>
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
