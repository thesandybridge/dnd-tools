import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MapLoader from './MapLoader'

export default async function Map() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  return (
    <MapLoader user_id={session.user.id} />
  )
}
