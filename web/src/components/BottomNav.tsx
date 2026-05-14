'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Users, Package, Calculator, Wrench, BarChart2, Settings } from 'lucide-react'

const navItems = [
  {
    href: '/dex/pokemon',
    label: '도감',
    icon: BookOpen,
    isActive: (p: string) => p.startsWith('/dex'),
  },
  {
    href: '/samples',
    label: '샘플',
    icon: Users,
    isActive: (p: string) => p.startsWith('/samples'),
  },
  {
    href: '/tools/party',
    label: '파티',
    icon: Package,
    isActive: (p: string) => p.startsWith('/tools/party'),
  },
  {
    href: '/tools/damage',
    label: '계산기',
    icon: Calculator,
    isActive: (p: string) => p.startsWith('/tools/damage'),
  },
  {
    href: '/tools',
    label: '도구',
    icon: Wrench,
    isActive: (p: string) => p === '/tools',
  },
  {
    href: '/stats',
    label: '통계',
    icon: BarChart2,
    isActive: (p: string) => p.startsWith('/stats'),
  },
  {
    href: '/settings',
    label: '설정',
    icon: Settings,
    isActive: (p: string) => p.startsWith('/settings'),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="mx-auto max-w-[480px] flex">
        {navItems.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
