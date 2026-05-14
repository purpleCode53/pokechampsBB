'use client'

import { useEffect, useState } from 'react'
import { getTypeMatchupTable } from '@/lib/queries'
import { getTypeBg } from '@/lib/typeColors'

type TableData = Awaited<ReturnType<typeof getTypeMatchupTable>>

const MULTIPLIER_STYLE: Record<number, string> = {
  0:   'bg-gray-800 text-gray-500',
  0.5: 'bg-red-950 text-red-400',
  1:   'bg-transparent text-gray-600',
  2:   'bg-green-950 text-green-400',
}

const MULTIPLIER_LABEL: Record<number, string> = {
  0: '0', 0.5: '½', 1: '', 2: '2',
}

export default function TypesPage() {
  const [data, setData] = useState<TableData | null>(null)

  useEffect(() => {
    getTypeMatchupTable().then(setData)
  }, [])

  if (!data) return <div className="p-8 text-gray-400 text-sm">불러오는 중...</div>

  const { types, matchupMap } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">타입 상성표</h1>
      <p className="text-sm text-gray-400 mb-6">행 = 공격 타입 / 열 = 방어 타입</p>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-16 h-8" />
              {types.map(t => (
                <th key={t.id} className="w-8 h-16 p-0">
                  <div className="flex items-end justify-center h-full pb-1">
                    <span
                      className="writing-mode-vertical text-white text-[10px] font-medium px-1 py-0.5 rounded"
                      style={{ backgroundColor: getTypeBg(t.name_ko) ?? '#666', writingMode: 'vertical-rl' }}
                    >
                      {t.name_ko}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map(atk => (
              <tr key={atk.id}>
                <td className="pr-2 py-0.5">
                  <span
                    className="text-white text-[10px] font-medium px-1.5 py-0.5 rounded inline-block w-full text-right"
                    style={{ backgroundColor: getTypeBg(atk.name_ko) ?? '#666' }}
                  >
                    {atk.name_ko}
                  </span>
                </td>
                {types.map(def => {
                  const multi = matchupMap[`${atk.id}_${def.id}`] ?? 1
                  return (
                    <td key={def.id} className={`w-8 h-8 text-center font-bold ${MULTIPLIER_STYLE[multi] ?? 'text-gray-600'}`}>
                      {MULTIPLIER_LABEL[multi] ?? multi}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-6 mt-6 text-sm">
        <span className="flex items-center gap-2"><span className="text-green-400 font-bold">2</span> 효과가 굉장함</span>
        <span className="flex items-center gap-2"><span className="text-gray-400">1</span> 보통</span>
        <span className="flex items-center gap-2"><span className="text-red-400 font-bold">½</span> 효과가 별로</span>
        <span className="flex items-center gap-2"><span className="text-gray-500 font-bold">0</span> 효과 없음</span>
      </div>
    </div>
  )
}
