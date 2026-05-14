'use client'

import { useEffect, useState, useMemo } from 'react'
import { getMoveList } from '@/lib/queries'
import { getTypePillStyle } from '@/lib/typeColors'
import { Search } from 'lucide-react'

type Move = Awaited<ReturnType<typeof getMoveList>>[number]

const CLASS_LABEL: Record<string, string> = {
  physical: '물리',
  special:  '특수',
  status:   '변화',
}

const CLASS_STYLE: Record<string, string> = {
  physical: 'bg-orange-100 text-orange-700',
  special:  'bg-blue-100 text-blue-700',
  status:   'bg-gray-100 text-gray-600',
}

export default function MoveDexPage() {
  const [moves, setMoves] = useState<Move[]>([])
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMoveList().then(data => { setMoves(data); setLoading(false) })
  }, [])

  const types = useMemo(() => {
    const set = new Set<string>()
    moves.forEach(m => { if (m.type_name) set.add(m.type_name) })
    return Array.from(set).sort()
  }, [moves])

  const filtered = useMemo(() =>
    moves.filter(m => {
      const q = search.trim()
      return (
        (filterClass === 'all' || m.damage_class === filterClass) &&
        (filterType === 'all' || m.type_name === filterType) &&
        (!q || m.name_ko.includes(q) || m.name.toLowerCase().includes(q.toLowerCase()))
      )
    }),
    [moves, search, filterClass, filterType]
  )

  const classBtn = (value: string, label: string) => (
    <button
      key={value}
      onClick={() => setFilterClass(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        filterClass === value
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
          placeholder={loading ? '불러오는 중…' : `전체 ${moves.length}개 검색`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 shadow-sm"
        />
      </div>

      {/* 분류 필터 */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
        {classBtn('all', '전체')}
        {classBtn('physical', '물리')}
        {classBtn('special', '특수')}
        {classBtn('status', '변화')}
      </div>

      {/* 타입 필터 */}
      {!loading && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t === filterType ? 'all' : t)}
              style={filterType === t ? getTypePillStyle(t) : undefined}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === t ? '' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">불러오는 중…</div>
      ) : (
        <>
          {(search || filterClass !== 'all' || filterType !== 'all') && (
            <p className="text-xs text-gray-400 mb-2">{filtered.length}개</p>
          )}
          <div className="flex flex-col gap-2">
            {filtered.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
              >
                {/* 타입 pill + 분류 badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    style={getTypePillStyle(m.type_name)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  >
                    {m.type_name || '-'}
                  </span>
                  {m.damage_class && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CLASS_STYLE[m.damage_class] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CLASS_LABEL[m.damage_class] ?? m.damage_class}
                    </span>
                  )}
                </div>

                {/* 이름 */}
                <p className="text-sm font-semibold text-gray-900 leading-snug">{m.name_ko}</p>

                {/* 스탯 */}
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  위력 {m.power ?? '-'} · 명중 {m.accuracy ?? '-'} · PP {m.pp ?? '-'} · 우선도 {(m.priority ?? 0) > 0 ? `+${m.priority}` : (m.priority ?? 0)}
                </p>

                {/* 설명 */}
                {m.desc_ko && (
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                    {m.desc_ko}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
