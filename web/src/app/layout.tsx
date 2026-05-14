import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: '포케챔스',
  description: '포케챔스 도감 & 배틀 툴',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="bg-[#f5f5f7] text-gray-900 antialiased">
        <div className="mx-auto max-w-[480px]">
          <Navbar />
          <main className="pb-20">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
