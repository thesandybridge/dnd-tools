import { fetchUser } from "@/lib/users";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { User } from "../types/users";

const useFetchUser = (userId): UseQueryResult<User> => useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId)
})

export default useFetchUser
