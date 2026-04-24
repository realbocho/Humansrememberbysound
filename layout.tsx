import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import RoomClient from './RoomClient'

export default async function RoomPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Verify membership
  const { data: membership } = await supabase
    .from('room_members')
    .select()
    .eq('room_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const { data: room } = await supabase
    .from('rooms')
    .select()
    .eq('id', params.id)
    .single()

  if (!room) notFound()

  const { data: records } = await supabase
    .from('records')
    .select()
    .eq('room_id', params.id)
    .order('recorded_at', { ascending: false })

  return (
    <RoomClient
      user={user}
      room={room}
      initialRecords={records || []}
    />
  )
}
