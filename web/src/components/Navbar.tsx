'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dex/pokemon', label: '포켓몬' },
  { href: '/dex/abilities', label: '특성' },
  { href: '/dex/moves', label: '기술' },
  { href: '/dex/items', label: '도구' },
  { href: '/dex/stats', label: '스피드' },
  { href: '/dex/types', label: '상성표' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="px-4 pt-3 pb-1">
        <Link href="/" className="text-base font-bold text-gray-900 tracking-tight">
          포케챔스
        </Link>
      </div>
      <nav className="flex overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
