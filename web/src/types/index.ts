export interface Pokemon {
  id: number
  name: string
  hp: number
  attack: number
  defense: number
  sp_attack: number
  sp_defense: number
  speed: number
  types?: PokemonType[]
  abilities?: PokemonAbility[]
}

export interface PokemonType {
  slot: number
  type_id: number
  type?: Type
}

export interface PokemonAbility {
  slot: number
  ability_id: number
  is_hidden: boolean
  ability?: Ability
}

export interface Type {
  id: number
  name: string
}

export interface TypeMatchup {
  attacker_type_id: number
  defender_type_id: number
  multiplier: number
}

export interface Ability {
  id: number
  name: string
}

export interface Move {
  id: number
  name: string
  type_id: number | null
  damage_class: string | null
  power: number | null
  accuracy: number | null
  pp: number | null
  priority: number
  type?: Type
}

export interface Translation {
  language_id: number
  entity_type: string
  entity_id: number
  field: string
  value: string
}
