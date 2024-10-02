'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUsersPartial } from '@/lib/users'
import styles from "./search.module.css"
import { useDebounce } from '@/app/hooks/useDebounce'

export default function UserSearch({ onSubmit, submitText = "Submit" }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setSearchTerm(user.name)
  }

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: () => fetchUsersPartial(5, debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
    retry: false
  })

  const handleInputChange = (e) => {
    const { value } = e.target
    setSearchTerm(value)
    setSelectedUser(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedUser) {
      onSubmit(selectedUser)
      setSelectedUser(null)
      setSearchTerm('')
    }
  }

  return (
    <div>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Enter at least 3 characters"
          className={styles.searchInput}
        />

        {results.length > 0 && !selectedUser && (
          <ul className={styles.resultsDropdown}>
            {results.map((user) => (
              <li
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={styles.resultsItem}
                style={{ cursor: 'pointer' }}
              >
                {user.name} - {user.email}
              </li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={!selectedUser}>
          {submitText}
        </button>
      </form>

      {!isLoading && results.length === 0 && debouncedSearchTerm.length >= 3 && (
        <p>No users found matching your search.</p>
      )}
      {isLoading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  )
}
