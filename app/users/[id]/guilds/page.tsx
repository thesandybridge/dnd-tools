import GuildsTable from "@/app/guilds/components/GuildsTable";

export default async function Guilds({ params }) {
  const { id } = await params
  return (
    <GuildsTable userId={id} isUserProfile/>
  )
}
