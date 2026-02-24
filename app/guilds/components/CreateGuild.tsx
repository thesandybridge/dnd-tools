'use client'

import useCreateGuildMutation from "../hooks/useCreateGuildMutation"
import { formOptions, useForm } from "@tanstack/react-form";
import { uuid } from "@/utils/helpers";
import { Guild } from "@/lib/guilds";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <form className="flex w-full justify-center gap-3 items-end" onSubmit={handleSubmit}>
      <form.Field
        name="name"
        asyncDebounceMs={500}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <Input
              type="text"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              required
              placeholder="Enter guild name"
              className={isError ? "border-destructive" : ""}
            />
            {isError && (
              <p className="text-xs text-destructive">{error.message}</p>
            )}
          </div>
        )}
      </form.Field>

      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? 'Creating...' : 'Create Guild'}
      </Button>
    </form>
  )
}
