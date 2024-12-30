'use client'

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Guild, createGuild } from "@/lib/guilds"

import styles from "./guilds.module.css"
import { uuid } from "@/utils/helpers"
import useCreateGuildMutation from "../hooks/useCreateGuildMutation"

export default function CreateGuild({ userId }: { userId: string }) {
  const { formData, setFormData, createGuild, mutation } = useCreateGuildMutation(userId);
  const { isLoading, error } = mutation


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGuild(formData)
  }

  return (
    <form className={styles.createGuild} onSubmit={handleSubmit}>
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
