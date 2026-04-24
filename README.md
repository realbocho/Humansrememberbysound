# 소리로 기록해드릴~게~요~!! 🎙

순간의 소리를 LP 레코드로 담는 사운드 다이어리.

---

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend/DB**: Supabase (PostgreSQL + Storage + Auth)
- **배포**: Vercel

---

## 로컬 개발 세팅

### 1. 레포 클론

```bash
git clone https://github.com/YOUR_USERNAME/sound-diary.git
cd sound-diary
npm install
```

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/migrations/001_init.sql` 전체 내용 실행
3. **Storage** 탭 → `sound-diary` 버킷이 생성됐는지 확인 (SQL에서 자동 생성됨)
4. **Project Settings → API** 탭에서 다음 값을 복사:
   - `Project URL`
   - `anon public` 키

### 3. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Supabase 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### 4. 로컬 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

---

## Vercel 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sound-diary.git
git push -u origin main
```

### 2. Vercel 연결

1. [vercel.com](https://vercel.com) → **New Project** → GitHub 레포 선택
2. **Environment Variables** 탭에서 아래 두 값 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** 클릭

### 3. Supabase Auth URL 허용

Supabase Dashboard → **Authentication → URL Configuration** 에서:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 기능 안내

### 방(Room) 시스템
- 로그인 후 **새 방 만들기** → 6자리 초대 코드 자동 발급
- 초대 코드를 친구에게 공유 → 친구는 **방 참여**에 코드 입력
- 방 안의 모든 LP는 해당 방 멤버만 접근 가능

### 녹음
- **● REC** 버튼 → 마이크 탭 → 최대 15초 녹음
- 날짜/시간/위치 자동 기록
- 제목(선택) + 사진(선택) 추가 후 저장

### LP 갤러리
- 날짜별 선반(Shelf)에 LP가 꽂혀 있는 형태
- 마우스로 드래그하여 레코드 샵처럼 뒤적이기
- LP 클릭 → 턴테이블 뷰로 전환 → 바늘 내려오며 재생

---

## Supabase 저장 한도 초과 시

저장 공간이 가득 찬 경우 앱에서 다음 메시지가 표시됩니다:

> ⚠️ 저장 공간 초과 — 개발자에게 문의해주세요 (supabase storage limit)

이 경우 Supabase Dashboard → **Storage** 탭에서 용량을 확인하고,
플랜 업그레이드 또는 오래된 파일 정리가 필요합니다.

---

## 프로젝트 구조

```
sound-diary/
├── app/
│   ├── auth/           # 로그인/회원가입
│   ├── gallery/        # 방 목록
│   ├── room/[id]/      # 실제 LP 갤러리 + 녹음 + 플레이어
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts   # 브라우저 Supabase 클라이언트
│   │   └── server.ts   # 서버 Supabase 클라이언트
│   └── types.ts
├── middleware.ts        # 인증 미들웨어
└── supabase/
    └── migrations/
        └── 001_init.sql
```
