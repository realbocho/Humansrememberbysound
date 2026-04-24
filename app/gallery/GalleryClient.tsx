'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Room } from '@/lib/types'
import styles from './gallery.module.css'

const LABEL_COLORS = ['#C94B3A','#2E6B4A','#1E3A5F','#7A4E2D','#5B2D8E','#8B6914']

interface Props {
  user: { id: string; email?: string }
  initialRooms: Room[]
}

export default function GalleryClient({ user, initialRooms }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [modal, setModal] = useState<'create' | 'join' | null>(null)
  const [roomName, setRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type?: 'error' } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  function showToast(msg: string, type?: 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function createRoom() {
    if (!roomName.trim()) return
    setLoading(true)
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({ name: roomName.trim(), invite_code: code, owner_id: user.id })
        .select()
        .single()
      if (error) throw error

      const { error: memberError } = await supabase
        .from('room_members')
        .insert({ room_id: room.id, user_id: user.id })
      if (memberError) throw memberError

      setRooms(prev => [...prev, room])
      setModal(null)
      setRoomName('')
      showToast(`방이 생성되었습니다! 초대 코드: ${code}`)
      router.push(`/room/${room.id}`)
      router.refresh()
    } catch (e: any) {
      showToast(e.message || '오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom() {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      const { data: room, error } = await supabase
        .rpc('join_room_by_invite', { invite: inviteCode.trim().toUpperCase() })
      if (error || !room) throw new Error('올바르지 않은 초대 코드입니다')

      if (!rooms.find(r => r.id === room.id)) {
        setRooms(prev => [...prev, room])
      }
      setModal(null)
      setInviteCode('')
      showToast('방에 입장했습니다 🎵')
      router.push(`/room/${room.id}`)
      router.refresh()
    } catch (e: any) {
      showToast(e.message || '오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.eyebrow}>Sound Diary</div>
          <div className={styles.wordmark}>Humans remember by sound</div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{user.email}</span>
          <button className="btn-ghost" onClick={() => setModal('join')}>방 참여</button>
          <button className="btn-primary" onClick={() => setModal('create')}>+ 새 방</button>
          <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
        </div>
      </header>

      {/* Room list */}
      <main className={styles.main}>
        {rooms.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎙</div>
            <div className={styles.emptyTitle}>아직 방이 없어요</div>
            <div className={styles.emptySub}>새 방을 만들거나 초대 코드로 참여해보세요</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setModal('join')}>코드로 참여</button>
              <button className="btn-primary" onClick={() => setModal('create')}>방 만들기</button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.sectionLabel}>나의 레코드 룸</div>
            <div className={styles.roomGrid}>
              {rooms.map((room, i) => (
                <button
                  key={room.id}
                  className={styles.roomCard}
                  onClick={() => router.push(`/room/${room.id}`)}
                  style={{ '--color': LABEL_COLORS[i % LABEL_COLORS.length] } as any}
                >
                  <div className={styles.roomDisc}>
                    <div className={styles.roomDiscGrooves} />
                    <div className={styles.roomDiscLabel}>
                      <span className={styles.roomDiscName}>{room.name}</span>
                      <span className={styles.roomDiscCode}>{room.invite_code}</span>
                    </div>
                    <div className={styles.roomDiscSpindle} />
                  </div>
                  <div className={styles.roomInfo}>
                    <div className={styles.roomName}>{room.name}</div>
                    <div className={styles.roomCode}>코드 · {room.invite_code}</div>
                    <div className={styles.roomDate}>
                      {new Date(room.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {modal === 'create' ? '새 방 만들기' : '초대 코드로 참여'}
            </div>
            {modal === 'create' ? (
              <div className={styles.modalFields}>
                <div className="field">
                  <label>방 이름</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="우리 여름 여행 🌊"
                    maxLength={30}
                    onKeyDown={e => e.key === 'Enter' && createRoom()}
                  />
                </div>
                <button className="btn-primary" onClick={createRoom} disabled={loading || !roomName.trim()}>
                  {loading ? '...' : '방 만들기'}
                </button>
              </div>
            ) : (
              <div className={styles.modalFields}>
                <div className="field">
                  <label>초대 코드 6자리</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="AB1C2D"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && joinRoom()}
                    style={{ letterSpacing: '0.3em', fontSize: 16 }}
                  />
                </div>
                <button className="btn-primary" onClick={joinRoom} disabled={loading || inviteCode.length < 6}>
                  {loading ? '...' : '입장하기'}
                </button>
              </div>
            )}
            <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast show ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
