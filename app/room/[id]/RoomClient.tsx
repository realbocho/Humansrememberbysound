'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Room, Record as DiaryRecord } from '@/lib/types'
import styles from './room.module.css'

const LABEL_COLORS = ['#C94B3A','#2E6B4A','#1E3A5F','#7A4E2D','#5B2D8E','#8B6914']
const EMOJIS = ['🌿','🌧','🎶','🌊','🍂','☕','🎉','🌙','🌸','🎸','🍃','🌈']

// ─── helpers ──────────────────────────────────────────────────
function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s) % 60).padStart(2, '0')}`
}

function getLabelColor(i: number) { return LABEL_COLORS[i % LABEL_COLORS.length] }
function getEmoji(i: number) { return EMOJIS[i % EMOJIS.length] }

// ─── types ────────────────────────────────────────────────────
type Screen = 'gallery' | 'record' | 'player'

interface Props {
  user: { id: string; email?: string }
  room: Room
  initialRecords: DiaryRecord[]
}

// ═══════════════════════════════════════════════════════════════
export default function RoomClient({ user, room, initialRecords }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [screen, setScreen] = useState<Screen>('gallery')
  const [records, setRecords] = useState<DiaryRecord[]>(initialRecords)
  const [signedRecords, setSignedRecords] = useState<Map<string, { audio: string; photo?: string }>>(new Map())
  const [toast, setToast] = useState<{ msg: string; type?: 'error' } | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Record screen state
  const [isRecording, setIsRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [recDone, setRecDone] = useState(false)
  const [recTitle, setRecTitle] = useState('')
  const [recPhotoFile, setRecPhotoFile] = useState<File | null>(null)
  const [recPhotoUrl, setRecPhotoUrl] = useState<string | null>(null)
  const [recLocation, setRecLocation] = useState('위치 가져오는 중…')
  const [recLocationData, setRecLocationData] = useState<{ lat?: number; lng?: number; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordedBlobRef = useRef<Blob | null>(null)
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const waveRAFRef = useRef<number | null>(null)

  // Player screen state
  const [playerRecord, setPlayerRecord] = useState<DiaryRecord | null>(null)
  const [playerIdx, setPlayerIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const playerAudioRef = useRef<HTMLAudioElement | null>(null)
  const playerRAFRef = useRef<number | null>(null)

  function showToast(msg: string, type?: 'error') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3200)
  }

  // Sign URLs for records on mount + when records change
  useEffect(() => {
    async function signAll() {
      const newMap = new Map(signedRecords)
      for (const r of records) {
        if (newMap.has(r.id)) continue
        const urls: { audio: string; photo?: string } = { audio: '' }
        const { data: audioSigned } = await supabase.storage
          .from('sound-diary')
          .createSignedUrl(r.audio_path, 3600)
        if (audioSigned) urls.audio = audioSigned.signedUrl
        if (r.photo_path) {
          const { data: photoSigned } = await supabase.storage
            .from('sound-diary')
            .createSignedUrl(r.photo_path, 3600)
          if (photoSigned) urls.photo = photoSigned.signedUrl
        }
        newMap.set(r.id, urls)
      }
      setSignedRecords(newMap)
    }
    if (records.length > 0) signAll()
  }, [records])

  // ── RECORD SCREEN ──────────────────────────────────────────
  function openRecord() {
    setIsRecording(false)
    setRecSeconds(0)
    setRecDone(false)
    setRecTitle('')
    setRecPhotoFile(null)
    setRecPhotoUrl(null)
    recordedBlobRef.current = null
    audioChunksRef.current = []
    setRecLocation('위치 가져오는 중…')
    setRecLocationData(null)
    setScreen('record')
    fetchLocation()
    setTimeout(buildWaveform, 50)
  }

  function fetchLocation() {
    if (!navigator.geolocation) {
      setRecLocation('위치 사용 불가')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`)
          const data = await res.json()
          const addr = data.address
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || ''
          const sub = addr.suburb || addr.quarter || addr.neighbourhood || ''
          const text = sub ? `${sub}, ${city}` : city
          setRecLocation(text || `${lat.toFixed(3)}, ${lng.toFixed(3)}`)
          setRecLocationData({ lat, lng, text: text || `${lat.toFixed(3)}, ${lng.toFixed(3)}` })
        } catch {
          const text = `${lat.toFixed(3)}, ${lng.toFixed(3)}`
          setRecLocation(text)
          setRecLocationData({ lat, lng, text })
        }
      },
      () => setRecLocation('위치 권한 없음')
    )
  }

  function buildWaveform() {
    const wf = document.getElementById('waveform')
    if (!wf) return
    wf.innerHTML = ''
    for (let i = 0; i < 48; i++) {
      const bar = document.createElement('div')
      bar.className = styles.waveBar
      bar.id = `wb-${i}`
      wf.appendChild(bar)
    }
  }

  async function toggleRecord() {
    if (isRecording) {
      stopRecording()
    } else if (!recDone) {
      await startRecording()
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 128
      const src = audioCtxRef.current.createMediaStreamSource(stream)
      src.connect(analyserRef.current)

      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        recordedBlobRef.current = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecDone(true)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
      setRecSeconds(0)

      recTimerRef.current = setInterval(() => {
        setRecSeconds(s => {
          if (s + 1 >= 15) {
            stopRecording()
            return 15
          }
          return s + 1
        })
      }, 1000)
      animateWaveform()
    } catch {
      showToast('마이크 권한이 필요합니다', 'error')
    }
  }

  function stopRecording() {
    if (!isRecording) return
    setIsRecording(false)
    clearInterval(recTimerRef.current!)
    if (waveRAFRef.current) cancelAnimationFrame(waveRAFRef.current)
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    resetWaveBars()
  }

  function resetWaveBars() {
    for (let i = 0; i < 48; i++) {
      const bar = document.getElementById(`wb-${i}`)
      if (bar) { bar.style.height = '6px'; bar.classList.remove(styles.waveBarActive) }
    }
  }

  function animateWaveform() {
    if (!analyserRef.current) return
    const bufLen = analyserRef.current.frequencyBinCount
    const data = new Uint8Array(bufLen)
    function draw() {
      waveRAFRef.current = requestAnimationFrame(draw)
      analyserRef.current!.getByteFrequencyData(data)
      for (let i = 0; i < 48; i++) {
        const idx = Math.floor(i * bufLen / 48)
        const val = data[idx] / 255
        const h = Math.max(4, val * 52)
        const bar = document.getElementById(`wb-${i}`)
        if (bar) {
          bar.style.height = h + 'px'
          bar.classList.toggle(styles.waveBarActive, val > 0.05)
        }
      }
    }
    draw()
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setRecPhotoFile(file)
    const url = URL.createObjectURL(file)
    setRecPhotoUrl(url)
  }

  async function saveRecord() {
    if (!recordedBlobRef.current || saving) return
    setSaving(true)

    try {
      const uid = user.id
      const ts = Date.now()
      const audioPath = `${uid}/${ts}_audio.webm`

      // Upload audio
      const { error: audioErr } = await supabase.storage
        .from('sound-diary')
        .upload(audioPath, recordedBlobRef.current, { contentType: 'audio/webm' })

      if (audioErr) {
        // Check for storage quota errors
        if (audioErr.message?.toLowerCase().includes('quota') ||
            audioErr.message?.toLowerCase().includes('limit') ||
            audioErr.statusCode === '413' ||
            audioErr.statusCode === '507') {
          showToast('⚠️ 저장 공간 초과 — 개발자에게 문의해주세요 (supabase storage limit)', 'error')
          return
        }
        throw audioErr
      }

      let photoPath: string | null = null
      if (recPhotoFile) {
        const ext = recPhotoFile.name.split('.').pop() || 'jpg'
        photoPath = `${uid}/${ts}_photo.${ext}`
        const { error: photoErr } = await supabase.storage
          .from('sound-diary')
          .upload(photoPath, recPhotoFile, { contentType: recPhotoFile.type })
        if (photoErr) {
          if (photoErr.message?.toLowerCase().includes('quota') ||
              photoErr.message?.toLowerCase().includes('limit') ||
              photoErr.statusCode === '413') {
            showToast('⚠️ 저장 공간 초과 — 개발자에게 문의해주세요', 'error')
            return
          }
          // Non-fatal: proceed without photo
          photoPath = null
        }
      }

      const { data: newRecord, error: dbErr } = await supabase
        .from('records')
        .insert({
          room_id: room.id,
          user_id: uid,
          title: recTitle.trim() || null,
          location: recLocationData?.text || null,
          latitude: recLocationData?.lat || null,
          longitude: recLocationData?.lng || null,
          duration: recSeconds || 15,
          audio_path: audioPath,
          photo_path: photoPath,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (dbErr) throw dbErr

      setRecords(prev => [newRecord, ...prev])
      showToast('LP가 저장되었습니다 🎵')
      setTimeout(() => setScreen('gallery'), 600)
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('quota') ||
          e.message?.toLowerCase().includes('storage') ||
          e.code === '23514') {
        showToast('⚠️ 저장 한도 초과 — 개발자에게 연락해주세요 (storage quota exceeded)', 'error')
      } else {
        showToast(e.message || '저장 중 오류가 발생했습니다', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── PLAYER ─────────────────────────────────────────────────
  function openPlayer(record: DiaryRecord, idx: number) {
    if (playerAudioRef.current) { playerAudioRef.current.pause(); playerAudioRef.current = null }
    if (playerRAFRef.current) cancelAnimationFrame(playerRAFRef.current)
    setPlayerRecord(record)
    setPlayerIdx(idx)
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setScreen('player')
  }

  function closePlayer() {
    if (playerAudioRef.current) { playerAudioRef.current.pause(); playerAudioRef.current = null }
    if (playerRAFRef.current) cancelAnimationFrame(playerRAFRef.current)
    setPlaying(false)
    setScreen('gallery')
  }

  function togglePlay() {
    if (!playerRecord) return
    const urls = signedRecords.get(playerRecord.id)
    if (!urls?.audio) { showToast('오디오를 불러오는 중입니다…'); return }

    if (playing) {
      playerAudioRef.current?.pause()
      setPlaying(false)
      if (playerRAFRef.current) cancelAnimationFrame(playerRAFRef.current)
    } else {
      if (!playerAudioRef.current) {
        const audio = new Audio(urls.audio)
        audio.onended = () => {
          setPlaying(false)
          setProgress(100)
          if (playerRAFRef.current) cancelAnimationFrame(playerRAFRef.current)
        }
        playerAudioRef.current = audio
      }
      playerAudioRef.current.play()
      setPlaying(true)
      updateProgress()
    }
  }

  function updateProgress() {
    function tick() {
      if (!playerAudioRef.current) return
      const dur = playerAudioRef.current.duration || playerRecord?.duration || 15
      const cur = playerAudioRef.current.currentTime
      setCurrentTime(cur)
      setProgress(Math.min((cur / dur) * 100, 100))
      playerRAFRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  function seekAudio(e: React.MouseEvent<HTMLDivElement>) {
    if (!playerAudioRef.current || !playerRecord) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const dur = playerAudioRef.current.duration || playerRecord.duration || 15
    playerAudioRef.current.currentTime = pct * dur
    setProgress(pct * 100)
  }

  async function deleteRecord() {
    if (!playerRecord || !confirm(`"${playerRecord.title || '무제'}" LP를 삭제하시겠습니까?`)) return
    await supabase.storage.from('sound-diary').remove([playerRecord.audio_path])
    if (playerRecord.photo_path) await supabase.storage.from('sound-diary').remove([playerRecord.photo_path])
    await supabase.from('records').delete().eq('id', playerRecord.id)
    setRecords(prev => prev.filter(r => r.id !== playerRecord.id))
    showToast('삭제되었습니다')
    closePlayer()
  }

  // Group records by month for shelf display
  const byMonth = records.reduce((acc, r, i) => {
    const d = new Date(r.recorded_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = { label, items: [] }
    acc[key].items.push({ r, idx: i })
    return acc
  }, {} as globalThis.Record<string, { label: string; items: { r: DiaryRecord; idx: number }[] }>)

  const months = Object.keys(byMonth).sort().reverse()
  const now = new Date()
  const autoDateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) +
    ' ' + now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.app}>

      {/* ══════ GALLERY SCREEN ══════ */}
      <div className={`${styles.screen} ${screen === 'gallery' ? styles.screenActive : ''}`} id="gallery">
        <header className={styles.galleryHeader}>
          <div className={styles.galleryBrand}>
            <button className={styles.backBtn} onClick={() => router.push('/gallery')}>← 갤러리</button>
            <div>
              <div className={styles.eyebrow}>Sound Diary · {room.invite_code}</div>
              <div className={styles.wordmark}>{room.name}</div>
            </div>
          </div>
          <div className={styles.galleryActions}>
            <div className={styles.recCount}>{records.length} records</div>
            <button className={styles.recBtn} onClick={openRecord}>● REC</button>
          </div>
        </header>

        <div className={styles.shelves}>
          {records.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎙</div>
              <div className={styles.emptyTitle}>첫 번째 소리를 담아보세요</div>
              <div className={styles.emptySub}>REC 버튼을 눌러 지금 이 순간을 기록하세요</div>
            </div>
          ) : (
            months.map(mk => {
              const { label, items } = byMonth[mk]
              return (
                <div key={mk} className={styles.shelfSection}>
                  <div className={styles.shelfLabel}>{label}</div>
                  <ShelfCrate
                    items={items}
                    signedRecords={signedRecords}
                    onOpen={({ r, idx }) => openPlayer(r, idx)}
                  />
                  <div className={styles.shelfPlank} />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ══════ RECORD SCREEN ══════ */}
      <div className={`${styles.screen} ${styles.darkScreen} ${screen === 'record' ? `${styles.screenActive} ${styles.darkScreenActive}` : ''}`}>
        <div className={styles.recHeader}>
          <div className={styles.recHeaderTitle}>새 LP 녹음</div>
          <button className={styles.closeBtn} onClick={() => { stopRecording(); setScreen('gallery') }}>✕</button>
        </div>

        <div className={styles.micArea}>
          <div className={styles.timeDisplay}>{fmtTime(recSeconds)}</div>
          <div className={styles.timeMax}>/ 0:15 max</div>

          <div className={styles.waveform} id="waveform" />

          <div className={styles.micBtnWrap}>
            {isRecording && <div className={styles.micPulse} />}
            <button
              className={`${styles.micBtn} ${isRecording ? styles.micBtnRecording : ''} ${recDone ? styles.micBtnDone : ''}`}
              onClick={toggleRecord}
            >
              {recDone ? '✓' : isRecording ? '⏹' : '🎙'}
            </button>
          </div>
          <div className={styles.micHint}>
            {recDone ? '녹음 완료! 저장하거나 다시 녹음하세요'
              : isRecording ? '탭하여 중지 (최대 15초)'
              : '탭하여 녹음 시작'}
          </div>
        </div>

        <div className={styles.recInfoBar}>
          <div className={styles.autoInfoRow}>
            <div className={styles.autoChip}><span>📅</span><span>{autoDateStr}</span></div>
            <div className={styles.autoChip}><span>📍</span><span>{recLocation}</span></div>
          </div>
          <div className={styles.recFormRow}>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="제목을 입력하세요 (선택)"
              value={recTitle}
              onChange={e => setRecTitle(e.target.value)}
              maxLength={40}
            />

            {recPhotoUrl ? (
              <div className={styles.photoPreview}>
                <img src={recPhotoUrl} alt="" />
                <button className={styles.photoRemove} onClick={() => { setRecPhotoFile(null); setRecPhotoUrl(null) }}>✕</button>
              </div>
            ) : (
              <label className={styles.photoBtn} htmlFor="photo-input">📷</label>
            )}
            <input type="file" id="photo-input" accept="image/*" onChange={handlePhotoChange} />

            <button
              className={styles.saveBtn}
              disabled={!recDone || saving}
              onClick={saveRecord}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* ══════ PLAYER SCREEN ══════ */}
      <div className={`${styles.screen} ${styles.darkScreen} ${screen === 'player' ? `${styles.screenActive} ${styles.darkScreenActive}` : ''}`}>
        {playerRecord && (
          <PlayerView
            record={playerRecord}
            idx={playerIdx}
            urls={signedRecords.get(playerRecord.id)}
            playing={playing}
            progress={progress}
            currentTime={currentTime}
            onBack={closePlayer}
            onTogglePlay={togglePlay}
            onSeek={seekAudio}
            onDelete={deleteRecord}
          />
        )}
      </div>

      {toast && (
        <div className={`toast show ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>
      )}
    </div>
  )
}

// ─── ShelfCrate component ─────────────────────────────────────
function ShelfCrate({
  items,
  signedRecords,
  onOpen,
}: {
  items: { r: DiaryRecord; idx: number }[]
  signedRecords: Map<string, { audio: string; photo?: string }>
  onOpen: (item: { r: DiaryRecord; idx: number }) => void
}) {
  const crateRef = useRef<HTMLDivElement>(null)
  let isDown = false, startX = 0, scrollLeft = 0

  function onMouseDown(e: React.MouseEvent) {
    isDown = true; startX = e.pageX - (crateRef.current?.offsetLeft || 0)
    scrollLeft = crateRef.current?.scrollLeft || 0
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDown || !crateRef.current) return
    e.preventDefault()
    crateRef.current.scrollLeft = scrollLeft - (e.pageX - (crateRef.current.offsetLeft || 0) - startX)
  }

  return (
    <div
      ref={crateRef}
      className={styles.crate}
      onMouseDown={onMouseDown}
      onMouseUp={() => { isDown = false }}
      onMouseLeave={() => { isDown = false }}
      onMouseMove={onMouseMove}
    >
      {items.map(({ r, idx }) => {
        const d = new Date(r.recorded_at)
        const urls = signedRecords.get(r.id)
        const labelColor = getLabelColor(idx)
        const emoji = getEmoji(idx)

        return (
          <div key={r.id} className={styles.lpItem} onClick={() => onOpen({ r, idx })}>
            <div className={styles.lpDisc}>
              <div className={styles.lpDiscInner} />
              <div className={styles.lpDiscShine} />
              <div className={styles.lpCenterLabel} style={{ background: labelColor }}>
                <div className={styles.labelDate}>
                  {d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}<br />
                  {d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className={styles.lpCover}>
              {urls?.photo
                ? <img src={urls.photo} alt={r.title || '무제'} />
                : <div className={styles.lpCoverEmoji} style={{ background: labelColor + '22' }}>{emoji}</div>
              }
            </div>
            <div className={styles.lpSpine}>
              <span className={styles.lpSpineText}>{r.title || '무제'}</span>
            </div>
            <div className={styles.lpMeta}>
              <div className={styles.lpMetaTitle}>{r.title || '무제'}</div>
              <div className={styles.lpMetaDate}>{d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
              {r.location && <div className={styles.lpMetaLoc}>{r.location}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── PlayerView component ─────────────────────────────────────
function PlayerView({
  record, idx, urls, playing, progress, currentTime,
  onBack, onTogglePlay, onSeek, onDelete,
}: {
  record: DiaryRecord
  idx: number
  urls?: { audio: string; photo?: string }
  playing: boolean
  progress: number
  currentTime: number
  onBack: () => void
  onTogglePlay: () => void
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onDelete: () => void
}) {
  const d = new Date(record.recorded_at)
  const labelColor = getLabelColor(idx)
  const emoji = getEmoji(idx)
  const dur = record.duration || 15

  return (
    <>
      <div className={styles.playerHeader}>
        <button className={styles.playerBack} onClick={onBack}>← BACK</button>
        <div className={styles.playerMeta}>
          <div className={styles.playerMetaDate}>
            {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · {d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {record.location && <div className={styles.playerMetaLoc}>{record.location}</div>}
        </div>
      </div>

      <div className={styles.turntableArea}>
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{record.title || '무제'}</div>
          <div className={styles.trackSub}>{record.location || '위치 정보 없음'}</div>
        </div>

        <div className={styles.platterBase}>
          <div className={`${styles.vinylPlatter} ${playing ? styles.spinning : ''}`}>
            <div className={styles.vinylGrooves} />
            <div className={styles.vinylShine} />
            <div className={styles.vinylArtRing}>
              {urls?.photo
                ? <img src={urls.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <div className={styles.vinylArtEmoji}>{emoji}</div>
              }
            </div>
            <div className={styles.vinylLabel} style={{ background: labelColor }}>
              <div className={styles.vinylLabelTitle}>{record.title || '무제'}</div>
              <div className={styles.vinylLabelDate}>{d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</div>
            </div>
            <div className={styles.vinylSpindle} />
          </div>

          {/* Tonearm */}
          <div className={`${styles.tonearm} ${playing ? styles.tonearmPlaying : styles.tonearmParked}`}>
            <svg viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <circle cx="68" cy="14" r="7" fill="#3A3530" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              <circle cx="68" cy="14" r="3" fill="#5A5448"/>
              <path d="M68 20 L68 110 Q68 125 55 138 L50 145" stroke="#4A4540" strokeWidth="4" strokeLinecap="round"/>
              <path d="M68 20 L68 110 Q68 125 55 138 L50 145" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round"/>
              <rect x="44" y="143" width="12" height="6" rx="2" fill="#3A3530" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              <line x1="50" y1="149" x2="50" y2="158" stroke="#C8A97A" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="50" cy="158" r="1.5" fill="#C8A97A"/>
            </svg>
          </div>
        </div>

        <div className={styles.progressArea}>
          <div className={styles.progressBar} onClick={onSeek}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressTimes}>
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(dur)}</span>
          </div>
        </div>

        <div className={styles.playControls}>
          <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
          <button className={styles.playBtn} onClick={onTogglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </>
  )
}
