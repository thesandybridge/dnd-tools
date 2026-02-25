'use client'

import { useState } from 'react'
import MembersNav from './MembersNav'
import MembersTab from './MembersTab'
import PendingTab from './PendingTab'

export default function MembersContent({ guildId, userId }: { guildId: string; userId: string }) {
  const [tab, setTab] = useState<'members' | 'pending'>('members')

  return (
    <div className="flex flex-col gap-4">
      <MembersNav activeTab={tab} onTabChange={setTab} guildId={guildId} userId={userId} />
      {tab === 'members' ? (
        <MembersTab userId={userId} />
      ) : (
        <PendingTab guildId={guildId} />
      )}
    </div>
  )
}
