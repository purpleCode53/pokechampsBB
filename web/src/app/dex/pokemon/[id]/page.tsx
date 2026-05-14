'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPokemonDetail } from '@/lib/queries'
import { getTypePillStyle } from '@/lib/typeColors'
import { ChevronLeft } from 'lucide-react'

type Detail = NonNullable<Awaited<ReturnType<typeof getPokemonDetail>>>

const STAT_LABELS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'sp_attack', label: '특공' },
  { key: 'sp_defense', label: '특방' },
  { key: 'speed', label: '스피드' },
]

const DAMAGE_CLASS: Record<string, string> = { physical: '물리', special: '특수', status: '변화' }

function StatBar({ value }: { value: number }) {
  const pct = Math.min((value / 255) * 100, 100)
  const color = value >= 100 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono w-8 text-right text-gray-700">{value}</span>
    </div>
  )
}

export default function PokemonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Detail | null>(null)
  const [tab, setTab] = useState<'moves' | 'abilities'>('abilities')

  useEffect(() => {
    getPokemonDetail(Number(id)).then(setData)
  }, [id])

  if (!data) return <div className="p-8 text-sm text-gray-400">불러오는 중...</div>

  return (
    <div className="px-4 pt-4 pb-4">
      <Link href="/dex/pokemon" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ChevronLeft size={16} /> 포켓몬 도감
      </Link>

      {/* 헤더 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex flex-col items-center gap-2 mb-5">
          <Image
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`}
            alt={data.name_ko}
            width={140}
            height={140}
            unoptimized
            className="drop-shadow-lg"
          />
          <p className="text-xs text-gray-400">No.{String(data.id).padStart(4, '0')}</p>
          <h1 className="text-2xl font-bold text-gray-900">{data.name_ko}</h1>
          <p className="text-sm text-gray-400">{data.name_en}</p>
          <div className="flex gap-2">
            {data.types.map(t => (
              <span
                key={t.type_id}
                style={getTypePillStyle(t.name)}
                className="px-3 py-1 rounded-full text-sm font-medium"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* 종족값 */}
        <div className="grid grid-cols-1 gap-2">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[4rem_1fr] items-center gap-3">
              <span className="text-xs text-gray-500 text-right">{label}</span>
              <StatBar value={data[key as keyof typeof data] as number} />
            </div>
          ))}
          <div className="grid grid-cols-[4rem_1fr] items-center gap-3 mt-1">
            <span className="text-xs text-gray-500 text-right font-bold">합계</span>
            <span className="text-sm font-bold text-gray-900">{data.total}</span>
          </div>
        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-3">
        {(['abilities', 'moves'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'abilities' ? `특성 (${data.abilities.length})` : `기술 (${data.moves.length})`}
          </button>
        ))}
      </div>

      {/* 특성 목록 */}
      {tab === 'abilities' && (
        <div className="flex flex-col gap-2">
          {data.abilities.map(a => (
            <Link
              key={a.ability_id}
              href={`/dex/abilities/${a.ability_id}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-gray-900">{a.name}</span>
              {a.is_hidden && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                  숨겨진 특성
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 기술 목록 */}
      {tab === 'moves' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4">기술명</th>
                <th className="py-2.5 pr-3">타입</th>
                <th className="py-2.5 pr-3">분류</th>
                <th className="py-2.5 pr-3 text-right">위력</th>
                <th className="py-2.5 pr-3 text-right">명중</th>
                <th className="py-2.5 pr-4 text-right">PP</th>
              </tr>
            </thead>
            <tbody>
              {data.moves.map(m => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-4">
                    <Link href={`/dex/moves/${m.id}`} className="text-blue-600 hover:underline font-medium">
                      {m.name_ko}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      style={getTypePillStyle(m.type_name)}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {m.type_name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-500">{DAMAGE_CLASS[m.damage_class ?? ''] ?? '-'}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-700">{m.power ?? '-'}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-700">{m.accuracy ?? '-'}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{m.pp ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
