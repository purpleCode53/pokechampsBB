'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAbilityDetail } from '@/lib/queries'
import { ChevronLeft } from 'lucide-react'

type Detail = NonNullable<Awaited<ReturnType<typeof getAbilityDetail>>>
type PokemonEntry = { id: number; is_hidden: boolean; name_ko: string }

function PokemonGrid({ list }: { list: PokemonEntry[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
      {list.map(p => (
        <Link key={p.id} href={`/dex/pokemon/${p.id}`}
          className="flex flex-col items-center p-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors text-center">
          <Image
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
            alt={p.name_ko} width={56} height={56} unoptimized className="pixelated"
          />
          <p className="text-xs mt-1 text-gray-300">{p.name_ko}</p>
        </Link>
      ))}
    </div>
  )
}

export default function AbilityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Detail | null>(null)

  useEffect(() => {
    getAbilityDetail(Number(id)).then(setData)
  }, [id])

  if (!data) return <div className="p-8 text-gray-400 text-sm">불러오는 중...</div>

  const pokemonList = data.pokemon as PokemonEntry[]
  const normal = pokemonList.filter(p => !p.is_hidden)
  const hidden = pokemonList.filter(p => p.is_hidden)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/dex/abilities" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
        <ChevronLeft size={16} /> 특성 도감
      </Link>

      <h1 className="text-3xl font-bold mb-1">{data.name_ko}</h1>
      <p className="text-gray-400 text-sm mb-6">{data.name}</p>

      <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl mb-8">
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{data.desc_ko || '설명 없음'}</p>
      </div>

      <h2 className="text-lg font-semibold mb-4">이 특성을 가진 포켓몬 ({data.pokemon.length})</h2>

      {normal.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">일반 특성</p>
          <PokemonGrid list={normal} />
        </div>
      )}

      {hidden.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-3">숨겨진 특성</p>
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <PokemonGrid list={hidden} />
          </div>
        </div>
      )}
    </div>
  )
}
