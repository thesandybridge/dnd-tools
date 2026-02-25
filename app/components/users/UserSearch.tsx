'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUsersPartial } from '@/lib/users'
import { useDebounce } from '@/app/hooks/useDebounce'
import { formOptions, useForm, useStore } from '@tanstack/react-form'
import { Guild } from '@/lib/guilds'
import useAddMemberMutation from '@/app/guilds/hooks/useAddMemberMutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  guildData?: Guild
  submitText?: string
  roleId?: number
}

export default function UserSearch({
  guildData,
  submitText = "Submit",
  roleId,
}: Props) {
  const [open, setOpen] = useState(false)
  const { mutation } = useAddMemberMutation(guildData, roleId)
  const {
    mutate: addMember,
    isPending: isAddingMember,
  } = mutation

  const formOpts = formOptions({
    defaultValues: {
      searchTerm: '',
      selectedUser: null as { id: string; name: string } | null,
    }
  })

  const form = useForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      if (value.selectedUser && value.selectedUser.id) {
        addMember(value.selectedUser);
        form.reset();
      }
    }
  });

  const searchTerm = useStore(form.store, state => state.values.searchTerm);
  const selectedUser = useStore(form.store, state => state.values.selectedUser);

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: results = [], isPending, isError, error } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: () => fetchUsersPartial(5, debouncedSearchTerm),
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false
  })

  return (
    <form className="flex gap-3 justify-center w-full items-end" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }}>
      <form.Field name="searchTerm">
        {({ state, handleChange }) => (
          <Popover open={open && results.length > 0} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder={selectedUser ? selectedUser.name : "Search users (3+ chars)"}
                  value={state.value}
                  onChange={(e) => {
                    handleChange(e.target.value)
                    setOpen(true)
                  }}
                  onFocus={() => results.length > 0 && setOpen(true)}
                  className={isError ? "border-destructive" : ""}
                />
                {isError && (
                  <p className="text-xs text-destructive mt-1">{error.message}</p>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
              <Command>
                <CommandList>
                  {isPending || isAddingMember ? (
                    <CommandGroup>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </CommandGroup>
                  ) : results.length === 0 ? (
                    <CommandEmpty>No users found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {results.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            form.setFieldValue('selectedUser', user)
                            form.setFieldValue('searchTerm', user.name)
                            setOpen(false)
                          }}
                        >
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </form.Field>
      <Button variant="outline" type="submit" disabled={!selectedUser || isAddingMember}>
        {isAddingMember ? 'Adding...' : submitText}
      </Button>
    </form>
  )
}
