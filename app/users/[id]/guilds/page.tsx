import GuildsTable from "@/app/guilds/components/GuildsTable";

export default function Guilds({params}) {
  return (
    <GuildsTable userId={params.id} isUserProfile/>
  )
}
