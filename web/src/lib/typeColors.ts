// Korean type name → classic PokeAPI hex palette
const TYPE_HEX_KO: Record<string, string> = {
  '노말':   '#A8A878',
  '불꽃':   '#F08030',
  '물':     '#6890F0',
  '풀':     '#78C850',
  '전기':   '#F8D030',
  '얼음':   '#98D8D8',
  '격투':   '#C03028',
  '독':     '#A040A0',
  '땅':     '#E0C068',
  '비행':   '#A890F0',
  '에스퍼': '#F85888',
  '벌레':   '#A8B820',
  '바위':   '#B8A038',
  '고스트': '#705898',
  '드래곤': '#7038F8',
  '악':     '#705848',
  '강철':   '#B8B8D0',
  '페어리': '#EE99AC',
  '스텔라': '#40B5A5',
}

// Types with light background that need dark text
const LIGHT_TYPES = new Set(['전기', '얼음', '땅', '강철', '노말', '페어리'])

export function getTypePillStyle(korName: string): { backgroundColor: string; color: string } {
  const bg = TYPE_HEX_KO[korName] ?? '#9CA3AF'
  return { backgroundColor: bg, color: LIGHT_TYPES.has(korName) ? '#333333' : '#ffffff' }
}

export function getTypeBg(korName: string): string {
  return TYPE_HEX_KO[korName] ?? '#9CA3AF'
}

// Legacy Tailwind mapping (kept for existing detail pages)
export const TYPE_COLORS: Record<string, string> = {
  normal:   'bg-gray-400 text-gray-900',
  fire:     'bg-orange-500 text-white',
  water:    'bg-blue-500 text-white',
  grass:    'bg-green-500 text-white',
  electric: 'bg-yellow-400 text-gray-900',
  ice:      'bg-cyan-400 text-gray-900',
  fighting: 'bg-red-700 text-white',
  poison:   'bg-purple-500 text-white',
  ground:   'bg-yellow-600 text-white',
  flying:   'bg-indigo-400 text-white',
  psychic:  'bg-pink-500 text-white',
  bug:      'bg-lime-500 text-gray-900',
  rock:     'bg-yellow-700 text-white',
  ghost:    'bg-violet-700 text-white',
  dragon:   'bg-violet-600 text-white',
  dark:     'bg-gray-700 text-white',
  steel:    'bg-slate-400 text-gray-900',
  fairy:    'bg-pink-300 text-gray-900',
  stellar:  'bg-sky-500 text-white',
}

export function getTypeColor(typeName: string) {
  return TYPE_COLORS[typeName] ?? 'bg-gray-500 text-white'
}
