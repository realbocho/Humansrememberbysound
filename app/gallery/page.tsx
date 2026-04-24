import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GalleryClient from './GalleryClient'

export default async function GalleryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch user's rooms (rooms where they are a member)
  const { data: memberRooms } = await supabase
    .from('room_members')
    .select('room_id, rooms(*)')
    .eq('user_id', user.id)

  const rooms = memberRooms?.map((m: any) => m.rooms).filter(Boolean) || []

  return <GalleryClient user={user} initialRooms={rooms} />
}
