import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Humans remember by sound!',
  description: '순간의 소리를 LP로 담는 사운드 다이어리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=Noto+Serif+KR:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
