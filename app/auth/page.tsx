'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './auth.module.css'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type?: 'error' | 'ok' } | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'error' | 'ok' = 'ok') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        showToast('이메일을 확인해주세요 ✉️')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/gallery')
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || '오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.visual}>
          <div className={styles.vinylStack}>
            {['#C94B3A','#2E6B4A','#1E3A5F','#7A4E2D'].map((c, i) => (
              <div key={i} className={styles.vinylDisc} style={{ '--c': c, '--i': i } as any} />
            ))}
          </div>
          <div className={styles.tagline}>
            <span className={styles.taglineKo}>순간의 소리를</span>
            <span className={styles.taglineKo}>LP로 담다</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.form}>
          <div className={styles.brand}>
            <div className={styles.eyebrow}>Sound Diary</div>
            <h1 className={styles.wordmark}>Humans remember by sound</h1>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => setMode('login')}
            >로그인</button>
            <button
              className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
              onClick={() => setMode('signup')}
            >회원가입</button>
          </div>

          <form onSubmit={handleSubmit} className={styles.fields}>
            <div className="field">
              <label>이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required
              />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? '...' : mode === 'login' ? '입장하기' : '계정 만들기'}
            </button>
          </form>

          <p className={styles.hint}>
            {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button className={styles.switchBtn} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? '가입하기' : '로그인'}
            </button>
          </p>
        </div>
      </div>

      {toast && (
        <div className={`toast show ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
