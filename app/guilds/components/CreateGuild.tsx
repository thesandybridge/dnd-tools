'use client'

import styles from "./guilds.module.css"
import useCreateGuildMutation from "../hooks/useCreateGuildMutation"
import { formOptions, useForm } from "@tanstack/react-form";
import { uuid } from "@/utils/helpers";
import { Guild } from "@/lib/guilds";
import { Button, TextField } from "@mui/material";

export default function CreateGuild({ userId }: { userId: string }) {
  const { mutation } = useCreateGuildMutation(userId);
  const { isPending, isError, error, mutate } = mutation

  const formOpts = formOptions<Guild>({
    defaultValues: {
      name: '',
      owner: userId,
      guild_id: uuid(),
    }
  })

  const form = useForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      mutate(value, {
        onSuccess: () => {
          form.reset();
        },
        onError: (error) => {
          console.error('Error creating guild:', error.message);
        }
      })
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form className={styles.createGuild} onSubmit={handleSubmit}>
      <form.Field
        name="name"
        asyncDebounceMs={500}
      >
        {(field) => (
          <>
            <TextField
              type="text"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              error={isError}
              helperText={isError && error.message}
              onChange={(e) => field.handleChange(e.target.value)}
              required
              placeholder="Enter guild name"
            />
          </>
        )}
      </form.Field>

      <Button type="submit" disabled={isPending} variant="outlined">
        {isPending ? 'Creating...' : 'Create Guild'}
      </Button>
    </form>
  )
}
