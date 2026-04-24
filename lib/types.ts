export interface Room {
  id: string
  name: string
  invite_code: string
  owner_id: string
  created_at: string
}

export interface Record {
  id: string
  room_id: string
  user_id: string
  title: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  duration: number
  audio_path: string
  photo_path: string | null
  recorded_at: string
  created_at: string
  // enriched client-side
  audio_url?: string
  photo_url?: string
}
