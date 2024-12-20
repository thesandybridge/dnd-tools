'use client'

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGuild } from "@/lib/guilds"

import styles from "./guilds.module.css"

export default function CreateGuild({ userId }) {
  const [formData, setFormData] = useState({
    name: "",
    owner: userId
  })

  const queryClient = useQueryClient()

  const { mutate, isLoading, error } = useMutation({
    mutationFn: async () => {
      return createGuild(formData)
    },
    onSettled: (newGuild, err) => {
      if (newGuild) {
        // Update the cache with the new guild
        queryClient.setQueryData('guilds', (oldGuilds = []) => [
          ...oldGuilds,
          newGuild
        ])
      } else if (err) {
        console.error("Error creating guild:", err.message)
      }
      // Reset the form
      setFormData({ name: "", owner: userId })
    },
    onError: (err) => {
      console.error("Error updating guild:", err)
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleCreateGuild = (e) => {
    e.preventDefault()
    mutate()
  }

  return (
    <form className={styles.createGuild} onSubmit={handleCreateGuild}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Enter guild name"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Guild'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </form>
  )
}
