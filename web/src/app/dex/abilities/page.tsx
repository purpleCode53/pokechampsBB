'use client'

import { useEffect, useState, useMemo } from 'react'
import { getAbilityList } from '@/lib/queries'
import { Search, ChevronDown } from 'lucide-react'

type Ability = Awaited<ReturnType<typeof getAbilityList>>[number]

export default function AbilityDexPage() {
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAbilityList().then(data => { setAbilities(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() =>
    abilities.filter(a =>
      a.name_ko.includes(search.trim()) ||
      a.name.toLowerCase().includes(search.trim().toLowerCase())
    ),
    [abilities, search]
  )

  function toggle(id: number) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="px-4 pt-4">
      {/* 검색바 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={loading ? '불러오는 중…' : `전체 ${abilities.length}개 검색`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">불러오는 중…</div>
      ) : (
        <div className="flex flex-col gap-2">
          {!loading && search && (
            <p className="text-xs text-gray-400 mb-1">{filtered.length}개</p>
          )}
          {filtered.map(a => {
            const open = openIds.has(a.id)
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggle(a.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div>
                    <span className="font-semibold text-sm text-gray-900">{a.name_ko}</span>
                    {!open && a.desc_ko && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.desc_ko}</p>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 flex-shrink-0 ml-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 pt-3 leading-relaxed">
                      {a.desc_ko || '설명이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
