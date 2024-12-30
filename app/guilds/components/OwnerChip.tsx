import useFetchUser from "@/app/hooks/useFetchUser";
import { UUID } from "@/utils/types";
import Link from "next/link";

import styles from "./guilds.module.css"

interface Props {
  userId: UUID,
  isOwner: boolean,
  className?: string,
}

export default function OwnerChip({
  userId,
  isOwner,
  className,
  ...props
}: Props) {
  const { data } = useFetchUser(userId);

  if (!data) return null

  const mergedClassName = `${styles.currentUser} ${className || ''}`.trim();

  return isOwner ? (
    <Link
      href={`/users/${userId}`}
      className={mergedClassName}
      {...props}
    >
      {data.name}
    </Link>
  ) : (
    <span
      className={className}
      {...props}
    >{data.name}</span>
  )
}
