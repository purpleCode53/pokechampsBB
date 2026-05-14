'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPokemonList } from '@/lib/queries'
import { ChevronUp, ChevronDown } from 'lucide-react'

type Pokemon = Awaited<ReturnType<typeof getPokemonList>>[number]
type SortKey = 'id' | 'hp' | 'attack' | 'defense' | 'sp_attack' | 'sp_defense' | 'speed' | 'total'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'No.' },
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'sp_attack', label: '특공' },
  { key: 'sp_defense', label: '특방' },
  { key: 'speed', label: '스피드' },
  { key: 'total', label: '합계' },
]

export default function StatsPage() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showMega, setShowMega] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPokemonList().then(data => { setPokemon(data); setLoading(false) })
  }, [])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() =>
    [...pokemon]
    .filter(p => showMega || p.id < 10000)
    .sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    }), [pokemon, sortKey, sortDir])

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-20"><ChevronUp size={12} /></span>
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">계체값 순위</h1>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowMega(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showMega ? 'bg-violet-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          메가진화 {showMega ? '포함' : '제외'}
        </button>
        {!loading && <span className="text-sm text-gray-500">{sorted.length}마리</span>}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                {COLUMNS.map(({ key, label }) => (
                  <th key={key}
                    onClick={() => handleSort(key)}
                    className="pb-3 pr-4 text-right cursor-pointer hover:text-white select-none first:text-left"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="pb-3 text-left pl-4">포켓몬</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-900/50">
                  <td className="py-2 pr-4 text-gray-500">{String(p.id).padStart(4, '0')}</td>
                  {(['hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed', 'total'] as SortKey[]).map(k => (
                    <td key={k} className={`py-2 pr-4 text-right font-mono ${sortKey === k ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {p[k] as number}
                    </td>
                  ))}
                  <td className="py-2 pl-4">
                    <Link href={`/dex/pokemon/${p.id}`} className="flex items-center gap-2 hover:text-white">
                      <Image src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                        alt={p.name_ko} width={32} height={32} unoptimized className="pixelated" />
                      {p.name_ko}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
