import dynamic from 'next/dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Map() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const MapComponent = dynamic(() => import("./components/map/Map"), { ssr: false })

  return (
    <MapComponent user_id={session?.user.id} />
  )
}
