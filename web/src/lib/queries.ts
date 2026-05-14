import { supabase } from './supabase'

export async function getKoName(entityType: string, entityId: number): Promise<string | null> {
  const { data } = await supabase
    .from('translation')
    .select('value')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('field', 'name')
    .eq('language_id', 2) // ko
    .single()
  return data?.value ?? null
}

export async function getPokemonList() {
  // Supabase 기본 max rows = 1000이므로 일반(1~1025)과 메가(10000+)를 분리 조회
  const [{ data: normal }, { data: mega }] = await Promise.all([
    supabase
      .from('pokemon')
      .select('id, name, hp, attack, defense, sp_attack, sp_defense, speed')
      .lt('id', 10000)
      .eq('is_active', true)
      .order('id'),
    supabase
      .from('pokemon')
      .select('id, name, hp, attack, defense, sp_attack, sp_defense, speed')
      .gte('id', 10000)
      .eq('is_active', true)
      .order('id'),
  ])

  const pokemon = [...(normal ?? []), ...(mega ?? [])]
  if (!pokemon.length) return []

  const normalIds = (normal ?? []).map(p => p.id)
  const megaIds = (mega ?? []).map(p => p.id)

  const [
    { data: nameTrNormal },
    { data: nameTrMega },
    { data: typesTrNormal },
    { data: typesTrMega },
    { data: typeTranslations },
  ] = await Promise.all([
    supabase.from('translation').select('entity_id, value').eq('entity_type', 'pokemon').eq('field', 'name').eq('language_id', 2).in('entity_id', normalIds),
    megaIds.length
      ? supabase.from('translation').select('entity_id, value').eq('entity_type', 'pokemon').eq('field', 'name').eq('language_id', 2).in('entity_id', megaIds)
      : Promise.resolve({ data: [] }),
    supabase.from('pokemon_type').select('pokemon_id, slot, type_id').in('pokemon_id', normalIds).order('slot'),
    megaIds.length
      ? supabase.from('pokemon_type').select('pokemon_id, slot, type_id').in('pokemon_id', megaIds).order('slot')
      : Promise.resolve({ data: [] }),
    supabase.from('translation').select('entity_id, value').eq('entity_type', 'type').eq('field', 'name').eq('language_id', 2),
  ])

  const nameMap = Object.fromEntries(
    [...(nameTrNormal ?? []), ...(nameTrMega ?? [])].map(t => [t.entity_id, t.value])
  )
  const typeNameMap = Object.fromEntries((typeTranslations ?? []).map(t => [t.entity_id, t.value]))
  const typeMap: Record<number, { type_id: number; name: string }[]> = {}
  for (const pt of [...(typesTrNormal ?? []), ...(typesTrMega ?? [])]) {
    if (!typeMap[pt.pokemon_id]) typeMap[pt.pokemon_id] = []
    typeMap[pt.pokemon_id].push({ type_id: pt.type_id, name: typeNameMap[pt.type_id] ?? '' })
  }

  return pokemon.map(p => ({
    ...p,
    name_ko: nameMap[p.id] ?? p.name,
    types: typeMap[p.id] ?? [],
    total: p.hp + p.attack + p.defense + p.sp_attack + p.sp_defense + p.speed,
  }))
}

export async function getPokemonDetail(id: number) {
  const { data: pokemon } = await supabase
    .from('pokemon')
    .select('*')
    .eq('id', id)
    .single()
  if (!pokemon) return null

  const [{ data: nameTr }, { data: types }, { data: abilities }, { data: moves }] = await Promise.all([
    supabase.from('translation').select('value, language_id').eq('entity_type', 'pokemon').eq('entity_id', id).eq('field', 'name'),
    supabase.from('pokemon_type').select('slot, type_id').eq('pokemon_id', id).order('slot'),
    supabase.from('pokemon_ability').select('slot, is_hidden, ability_id').eq('pokemon_id', id).order('slot'),
    supabase.from('pokemon_move').select('move_id').eq('pokemon_id', id),
  ])

  const nameMap = Object.fromEntries((nameTr ?? []).map(t => [t.language_id, t.value]))

  // 타입 이름 조회
  const typeIds = (types ?? []).map(t => t.type_id)
  const { data: typeNames } = await supabase.from('translation').select('entity_id, value').eq('entity_type', 'type').eq('field', 'name').eq('language_id', 2).in('entity_id', typeIds)
  const typeNameMap = Object.fromEntries((typeNames ?? []).map(t => [t.entity_id, t.value]))

  // 특성 이름 조회
  const abilityIds = (abilities ?? []).map(a => a.ability_id)
  const { data: abilityNames } = await supabase.from('translation').select('entity_id, value').eq('entity_type', 'ability').eq('field', 'name').eq('language_id', 2).in('entity_id', abilityIds)
  const abilityNameMap = Object.fromEntries((abilityNames ?? []).map(a => [a.entity_id, a.value]))

  // 기술 이름 조회
  const moveIds = (moves ?? []).map(m => m.move_id)
  const { data: moveData } = await supabase.from('move').select('id, name, type_id, damage_class, power, accuracy, pp').in('id', moveIds)
  const { data: moveNamesTr } = await supabase.from('translation').select('entity_id, value').eq('entity_type', 'move').eq('field', 'name').eq('language_id', 2).in('entity_id', moveIds)
  const moveNameMap = Object.fromEntries((moveNamesTr ?? []).map(m => [m.entity_id, m.value]))

  // 타입 이름 (기술용)
  const moveMoveTypeIds = [...new Set((moveData ?? []).map(m => m.type_id).filter(Boolean))]
  const { data: moveMoveTypeNames } = await supabase.from('translation').select('entity_id, value').eq('entity_type', 'type').eq('field', 'name').eq('language_id', 2).in('entity_id', moveMoveTypeIds)
  const moveTypeNameMap = Object.fromEntries((moveMoveTypeNames ?? []).map(t => [t.entity_id, t.value]))

  return {
    ...pokemon,
    name_ko: nameMap[2] ?? pokemon.name,
    name_en: nameMap[1] ?? pokemon.name,
    total: pokemon.hp + pokemon.attack + pokemon.defense + pokemon.sp_attack + pokemon.sp_defense + pokemon.speed,
    types: (types ?? []).map(t => ({ ...t, name: typeNameMap[t.type_id] ?? '' })),
    abilities: (abilities ?? []).map(a => ({ ...a, name: abilityNameMap[a.ability_id] ?? '' })),
    moves: (moveData ?? []).map(m => ({
      ...m,
      name_ko: moveNameMap[m.id] ?? m.name,
      type_name: moveTypeNameMap[m.type_id ?? 0] ?? '',
    })),
  }
}

export async function getAbilityList() {
  const { data: abilities } = await supabase.from('ability').select('id, name').eq('is_active', true).order('id')
  if (!abilities) return []

  const ids = abilities.map(a => a.id)
  const { data: translations } = await supabase
    .from('translation').select('entity_id, value, field').eq('entity_type', 'ability').eq('language_id', 2).in('entity_id', ids)

  const nameMap: Record<number, string> = {}
  const descMap: Record<number, string> = {}
  for (const t of translations ?? []) {
    if (t.field === 'name') nameMap[t.entity_id] = t.value
    if (t.field === 'desc') descMap[t.entity_id] = t.value
  }

  return abilities.map(a => ({
    ...a,
    name_ko: nameMap[a.id] ?? a.name,
    desc_ko: descMap[a.id] ?? '',
  }))
}

export async function getAbilityDetail(id: number) {
  const { data: ability } = await supabase.from('ability').select('*').eq('id', id).single()
  if (!ability) return null

  const { data: translations } = await supabase
    .from('translation').select('value, field, language_id').eq('entity_type', 'ability').eq('entity_id', id)

  const { data: pokemonAbilities } = await supabase
    .from('pokemon_ability').select('pokemon_id, is_hidden').eq('ability_id', id)

  const pokemonIds = (pokemonAbilities ?? []).map(pa => pa.pokemon_id)
  const { data: pokemonTr } = await supabase
    .from('translation').select('entity_id, value').eq('entity_type', 'pokemon').eq('field', 'name').eq('language_id', 2).in('entity_id', pokemonIds)
  const pokemonNameMap = Object.fromEntries((pokemonTr ?? []).map(t => [t.entity_id, t.value]))

  const trMap: Record<string, Record<number, string>> = {}
  for (const t of translations ?? []) {
    if (!trMap[t.field]) trMap[t.field] = {}
    trMap[t.field][t.language_id] = t.value
  }

  return {
    ...ability,
    name_ko: trMap['name']?.[2] ?? ability.name,
    desc_ko: trMap['desc']?.[2] ?? '',
    pokemon: (pokemonAbilities ?? []).map(pa => ({
      id: pa.pokemon_id,
      is_hidden: pa.is_hidden,
      name_ko: pokemonNameMap[pa.pokemon_id] ?? String(pa.pokemon_id),
    })),
  }
}

export async function getMoveList() {
  const { data: moves } = await supabase
    .from('move').select('id, name, type_id, damage_class, power, accuracy, pp, priority').eq('is_active', true).order('id')
  if (!moves) return []

  const ids = moves.map(m => m.id)
  const typeIds = [...new Set(moves.map(m => m.type_id).filter(Boolean))]

  const [{ data: nameTr }, { data: descTr }, { data: typeNameTr }] = await Promise.all([
    supabase.from('translation').select('entity_id, value').eq('entity_type', 'move').eq('field', 'name').eq('language_id', 2).in('entity_id', ids),
    supabase.from('translation').select('entity_id, value').eq('entity_type', 'move').eq('field', 'desc').eq('language_id', 2).in('entity_id', ids),
    supabase.from('translation').select('entity_id, value').eq('entity_type', 'type').eq('field', 'name').eq('language_id', 2).in('entity_id', typeIds),
  ])

  const nameMap = Object.fromEntries((nameTr ?? []).map(t => [t.entity_id, t.value]))
  const descMap = Object.fromEntries((descTr ?? []).map(t => [t.entity_id, t.value]))
  const typeNameMap = Object.fromEntries((typeNameTr ?? []).map(t => [t.entity_id, t.value]))

  return moves.map(m => ({
    ...m,
    name_ko: nameMap[m.id] ?? m.name,
    desc_ko: descMap[m.id] ?? '',
    type_name: typeNameMap[m.type_id ?? 0] ?? '',
  }))
}

export async function getMoveDetail(id: number) {
  const { data: move } = await supabase.from('move').select('*').eq('id', id).single()
  if (!move) return null

  const [{ data: translations }, { data: pokemonMoves }] = await Promise.all([
    supabase.from('translation').select('value, field, language_id').eq('entity_type', 'move').eq('entity_id', id),
    supabase.from('pokemon_move').select('pokemon_id').eq('move_id', id),
  ])

  const pokemonIds = (pokemonMoves ?? []).map(pm => pm.pokemon_id)
  const { data: pokemonTr } = await supabase
    .from('translation').select('entity_id, value').eq('entity_type', 'pokemon').eq('field', 'name').eq('language_id', 2).in('entity_id', pokemonIds)
  const pokemonNameMap = Object.fromEntries((pokemonTr ?? []).map(t => [t.entity_id, t.value]))

  const { data: typeNameTr } = await supabase
    .from('translation').select('value').eq('entity_type', 'type').eq('entity_id', move.type_id).eq('field', 'name').eq('language_id', 2).single()

  const trMap: Record<string, Record<number, string>> = {}
  for (const t of translations ?? []) {
    if (!trMap[t.field]) trMap[t.field] = {}
    trMap[t.field][t.language_id] = t.value
  }

  return {
    ...move,
    name_ko: trMap['name']?.[2] ?? move.name,
    desc_ko: trMap['desc']?.[2] ?? '',
    type_name: typeNameTr?.value ?? '',
    pokemon: pokemonIds.map(pid => ({
      id: pid,
      name_ko: pokemonNameMap[pid] ?? String(pid),
    })),
  }
}

export async function getTypeMatchupTable() {
  const { data: types } = await supabase.from('type').select('id, name').order('id')
  const { data: matchups } = await supabase.from('type_matchup').select('attacker_type_id, defender_type_id, multiplier')
  const { data: typeNameTr } = await supabase
    .from('translation').select('entity_id, value').eq('entity_type', 'type').eq('field', 'name').eq('language_id', 2)

  const typeNameMap = Object.fromEntries((typeNameTr ?? []).map(t => [t.entity_id, t.value]))
  const matchupMap: Record<string, number> = {}
  for (const m of matchups ?? []) {
    matchupMap[`${m.attacker_type_id}_${m.defender_type_id}`] = Number(m.multiplier)
  }

  const filteredTypes = (types ?? []).filter(t => !['shadow', 'unknown'].includes(t.name))

  return {
    types: filteredTypes.map(t => ({ ...t, name_ko: typeNameMap[t.id] ?? t.name })),
    matchupMap,
  }
}
