'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getMoveDetail } from '@/lib/queries'
import { getTypeColor } from '@/lib/typeColors'
import { ChevronLeft } from 'lucide-react'

type Detail = NonNullable<Awaited<ReturnType<typeof getMoveDetail>>>

const DAMAGE_CLASS: Record<string, string> = { physical: '물리', special: '특수', status: '변화' }

function StatBox({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold">{value ?? '-'}</p>
    </div>
  )
}

export default function MoveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Detail | null>(null)

  useEffect(() => {
    getMoveDetail(Number(id)).then(setData)
  }, [id])

  if (!data) return <div className="p-8 text-gray-400 text-sm">불러오는 중...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/dex/moves" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
        <ChevronLeft size={16} /> 기술 도감
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">{data.name_ko}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(data.type_name)}`}>
          {data.type_name}
        </span>
        {data.damage_class && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
            {DAMAGE_CLASS[data.damage_class]}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-6">{data.name}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="위력" value={data.power} />
        <StatBox label="명중률" value={data.accuracy} />
        <StatBox label="PP" value={data.pp} />
        <StatBox label="우선도" value={data.priority > 0 ? `+${data.priority}` : data.priority} />
      </div>

      {data.desc_ko && (
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl mb-8">
          <p className="text-gray-300 leading-relaxed">{data.desc_ko}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">이 기술을 배울 수 있는 포켓몬 ({data.pokemon.length})</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
        {data.pokemon.map(p => (
          <Link key={p.id} href={`/dex/pokemon/${p.id}`}
            className="flex flex-col items-center p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors text-center">
            <Image src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
              alt={p.name_ko} width={56} height={56} unoptimized className="pixelated" />
            <p className="text-xs mt-1 text-gray-300">{p.name_ko}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
