'use client'

import useCreateGuildMutation from "../hooks/useCreateGuildMutation"
import { formOptions, useForm } from "@tanstack/react-form";
import { uuid } from "@/utils/helpers";
import { Guild } from "@/lib/guilds";
import { Input } from "@/components/ui/input"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Plus } from "lucide-react"

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
    <GlassPanel
      corona
      className="border-dashed border-white/[0.12] corona-border corona-pulse"
    >
      <form className="flex flex-col gap-4 p-5 h-full justify-center" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Plus className="h-5 w-5" />
          <span className="font-cinzel text-sm tracking-wide uppercase">Create New Guild</span>
        </div>

        <form.Field name="name" asyncDebounceMs={500}>
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Input
                type="text"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                placeholder="Enter guild name"
                className={`bg-white/[0.03] border-white/[0.08] placeholder:text-white/20 ${isError ? "border-destructive" : ""}`}
              />
              {isError && (
                <p className="text-xs text-destructive">{error.message}</p>
              )}
            </div>
          )}
        </form.Field>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 rounded-lg font-cinzel text-sm tracking-wide uppercase
            bg-primary/20 border border-primary/30 text-primary
            hover:bg-primary/30 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            corona-border corona-hover cursor-pointer relative"
        >
          {isPending ? 'Creating...' : 'Create Guild'}
        </button>
      </form>
    </GlassPanel>
  )
}
