import GuildsTable from "@/app/guilds/components/GuildsTable";

export default async function Guilds({ params }) {
  const { id } = await params
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      <GuildsTable userId={id} isUserProfile/>
    </div>
  )
}
