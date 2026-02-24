import useFetchUser from "@/app/hooks/useFetchUser";
import { UUID } from "@/utils/types";
import Link from "next/link";

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

  return isOwner ? (
    <Link
      href={`/users/${userId}`}
      className={`text-primary font-medium hover:underline ${className ?? ""}`}
      {...props}
    >
      {data.name}
    </Link>
  ) : (
    <span className={className} {...props}>
      {data.name}
    </span>
  )
}
