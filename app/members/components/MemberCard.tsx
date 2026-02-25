'use client'

import Link from 'next/link'
import type { DirectoryMember } from '@/lib/users'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import InvitePopover from './InvitePopover'

export default function MemberCard({ member }: { member: DirectoryMember }) {
  return (
    <GlassPanel coronaHover className="p-5 flex flex-col gap-3">
      <Link href={`/users/${member.id}`} className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-white/[0.08]">
          {member.image && <AvatarImage src={member.image} alt={member.name ?? ""} />}
          <AvatarFallback
            className="text-sm"
            style={member.color ? { backgroundColor: member.color } : undefined}
          >
            {member.name?.charAt(0)?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium truncate">{member.name || "Unknown"}</span>
      </Link>

      {member.guilds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {member.guilds.map((g) => (
            <Badge key={g.guild_id} variant="outline" className="text-xs">
              {g.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto pt-1">
        <InvitePopover targetUserId={member.id} targetUserName={member.name} />
      </div>
    </GlassPanel>
  )
}
