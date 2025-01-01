'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUsersPartial } from '@/lib/users'
import styles from "./search.module.css"
import { useDebounce } from '@/app/hooks/useDebounce'
import { formOptions, useForm, useStore } from '@tanstack/react-form'
import { Autocomplete, Button, TextField } from '@mui/material'
import { Guild } from '@/lib/guilds'
import useAddMemberMutation from '@/app/guilds/hooks/useAddMemberMutation'

interface Props {
  guildData?: Guild
  submitText?: string
}

export default function UserSearch({
  guildData,
  submitText = "Submit"
}: Props) {
  const { mutation } = useAddMemberMutation(guildData)
  const {
    mutate: addMember,
    isPending: isAddingMember,
  } = mutation

  const formOpts = formOptions({
    defaultValues: {
      searchTerm: '',
      selectedUser: null,
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

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: results = [], isPending, isError, error } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: () => fetchUsersPartial(5, debouncedSearchTerm),
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false
  })

  return (
    <form className={styles.searchForm} onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }}>
      <form.Field name="searchTerm">
        {({state, handleChange, handleBlur, form}) => (
          <Autocomplete
            className={styles.autocomplete}
            freeSolo
            options={results.map(user => user)}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            loading={isPending || isAddingMember}
            inputValue={state.value}
            onInputChange={(_, value) => {
              handleChange(value)
            }}
            onBlur={handleBlur}
            onChange={(_, value) => {
              form.setFieldValue('selectedUser', value)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                className={styles.searchInput}
                label="Search Users"
                placeholder="Enter at least 3 characters"
                error={isError}
                helperText={isError && error.message}
              />
            )}
          />
        )}
      </form.Field>
      <Button variant='outlined' type='submit' disabled={!form.state.values.selectedUser} >
        {submitText}
      </Button>
    </form>
  )
}
