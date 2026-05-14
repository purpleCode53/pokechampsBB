import Link from 'next/link'
import { BookOpen, Swords, BarChart2 } from 'lucide-react'

const cards = [
  {
    href: '/dex/pokemon',
    icon: BookOpen,
    title: '도감',
    desc: '포켓몬, 특성, 기술, 도구, 계체값, 상성표',
    color: 'text-blue-500',
  },
  {
    href: '/tools/damage',
    icon: Swords,
    title: '도구',
    desc: '데미지 계산기, 파티 빌더',
    color: 'text-orange-500',
  },
  {
    href: '/stats',
    icon: BarChart2,
    title: '통계',
    desc: '사용률, 기술·특성 채용률',
    color: 'text-green-500',
  },
]

export default function HomePage() {
  return (
    <div className="px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">포케챔스</h1>
        <p className="text-gray-500 text-sm">포켓몬 챔피언스 도감 & 배틀 툴</p>
      </div>
      <div className="flex flex-col gap-3">
        {cards.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-xl bg-gray-50 ${color}`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
