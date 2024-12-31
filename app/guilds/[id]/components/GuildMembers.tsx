'use client'

import { useGuild } from "../providers/GuildProvider"
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import styles from "./members.module.css"
import useDeleteMemberMutation from '../../hooks/useDeleteMemberMutation'

export default function GuildMembers({ userId }) {
  const { guildData, membersData, isAdminOrOwner } = useGuild()

  const { mutation } = useDeleteMemberMutation(guildData)
  const { mutate: deleteMemberMutate, isLoading: isDeleting, error } = mutation

  const columnHelper = createColumnHelper()

  const handleDeleteClick = (e, memberId) => {
    e.stopPropagation()
    e.preventDefault()
    deleteMemberMutate(memberId)
  }

  const columns = [
    columnHelper.accessor('users.name', {
      header: 'Member Name',
      cell: info => (
        <div className={styles.tableData}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <span className={styles.tableData}>{info.getValue()}</span>
      ),
    }),
    ...(isAdminOrOwner(userId) ? [
      columnHelper.display({
        header: 'Actions',
        cell: ({ row }) => (
          <div className={styles.tableData}>
            <button
              onClick={(e) => handleDeleteClick(e, row.original.user_id)}
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
    data: membersData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isDeleting) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div className={`${styles.table}`}>
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
