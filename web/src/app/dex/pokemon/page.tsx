'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPokemonList } from '@/lib/queries'
import { getTypePillStyle } from '@/lib/typeColors'
import { Search } from 'lucide-react'

type Pokemon = Awaited<ReturnType<typeof getPokemonList>>[number]

function formatNo(id: number) {
  return id >= 10000 ? `#${id}` : `#${String(id).padStart(4, '0')}`
}

function getSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export default function PokemonDexPage() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [search, setSearch] = useState('')
  const [showMode, setShowMode] = useState<'all' | 'normal' | 'mega'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPokemonList().then(data => { setPokemon(data); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    const slugToId: Record<string, number> = {}
    for (const p of pokemon) {
      if (p.id < 10000) slugToId[p.name] = p.id
    }
    return [...pokemon].sort((a, b) => {
      const aBase = a.id < 10000 ? a.id : (slugToId[a.name.split('-mega')[0]] ?? a.id)
      const bBase = b.id < 10000 ? b.id : (slugToId[b.name.split('-mega')[0]] ?? b.id)
      if (aBase !== bBase) return aBase - bBase
      return (a.id < 10000 ? 0 : 1) - (b.id < 10000 ? 0 : 1)
    })
  }, [pokemon])

  const filtered = useMemo(() => {
    return sorted.filter(p => {
      const isMega = p.id >= 10000
      if (showMode === 'normal' && isMega) return false
      if (showMode === 'mega' && !isMega) return false
      const q = search.trim()
      if (!q) return true
      return (
        p.name_ko.includes(q) ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        String(p.id).includes(q)
      )
    })
  }, [sorted, search, showMode])

  const modeBtn = (mode: typeof showMode, label: string) => (
    <button
      onClick={() => setShowMode(mode)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        showMode === mode
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="px-4 pt-4">
      {/* 검색바 */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={loading ? '불러오는 중…' : `전체 ${pokemon.length}마리 검색`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 shadow-sm"
        />
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-4">
        {modeBtn('all', '전체')}
        {modeBtn('normal', '일반')}
        {modeBtn('mega', '메가')}
        {!loading && (
          <span className="ml-auto text-xs text-gray-400">{filtered.length}마리</span>
        )}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">불러오는 중…</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => {
            const isMega = p.id >= 10000
            return (
              <Link
                key={p.id}
                href={`/dex/pokemon/${p.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* 스프라이트 */}
                <div className="w-[60px] h-[60px] flex items-center justify-center flex-shrink-0">
                  <Image
                    src={getSpriteUrl(p.id)}
                    alt={p.name_ko}
                    width={60}
                    height={60}
                    unoptimized
                    className="pixelated object-contain"
                  />
                </div>

                {/* 이름 + 종족값 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 leading-none mb-0.5">
                    {formatNo(p.id)}
                    {isMega && (
                      <span className="ml-1 text-[9px] bg-violet-100 text-violet-600 px-1 py-0.5 rounded font-bold">
                        MEGA
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                    {p.name_ko}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-snug mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    HP {p.hp} · 공격 {p.attack} · 방어 {p.defense} · 특공 {p.sp_attack} · 특방 {p.sp_defense} · 스피드 {p.speed}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    합계 {p.total}
                  </p>
                </div>

                {/* 타입 뱃지 */}
                <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                  {p.types.map(t => (
                    <span
                      key={t.type_id}
                      style={getTypePillStyle(t.name)}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
