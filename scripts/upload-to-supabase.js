const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DATA_DIR = path.join(__dirname, '../data');
const BATCH_SIZE = 500;

function readJsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

async function upsertBatch(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`[${table}] ${error.message}`);
  }
}

async function uploadTypes() {
  console.log('\n[1/9] type 업로드 중...');
  const files = readJsonFiles(path.join(DATA_DIR, 'types'));

  const types = files.map(t => ({ id: t.id, name: t.name }));
  await upsertBatch('type', types);
  console.log(`  → type ${types.length}개 완료`);

  console.log('[2/9] type_matchup 업로드 중...');
  const typeIndex = {};
  files.forEach(t => { typeIndex[t.name] = t.id; });

  const matchups = [];
  const multiplierMap = { no_damage_to: 0, half_damage_to: 0.5, double_damage_to: 2 };

  for (const t of files) {
    const attackerId = t.id;
    const added = new Set();

    for (const [relation, multiplier] of Object.entries(multiplierMap)) {
      for (const defenderName of t.matchup[relation]) {
        const defenderId = typeIndex[defenderName];
        if (defenderId === undefined) continue;
        const key = `${attackerId}_${defenderId}`;
        if (!added.has(key)) {
          matchups.push({ attacker_type_id: attackerId, defender_type_id: defenderId, multiplier });
          added.add(key);
        }
      }
    }
  }

  for (let i = 0; i < matchups.length; i += BATCH_SIZE) {
    const batch = matchups.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('type_matchup').upsert(batch, { onConflict: 'attacker_type_id,defender_type_id' });
    if (error) throw new Error(`[type_matchup] ${error.message}`);
  }
  console.log(`  → type_matchup ${matchups.length}개 완료`);
}

async function uploadAbilities() {
  console.log('[3/9] ability 업로드 중...');
  const files = readJsonFiles(path.join(DATA_DIR, 'abilities'));
  const abilities = files.map(a => ({ id: a.id, name: a.slug }));
  await upsertBatch('ability', abilities);
  console.log(`  → ability ${abilities.length}개 완료`);
  return files;
}

async function uploadMoves(typeIndex) {
  console.log('[4/9] move 업로드 중...');
  const files = readJsonFiles(path.join(DATA_DIR, 'moves'));
  const moves = files.map(m => ({
    id: m.id,
    name: m.slug,
    type_id: typeIndex[m.type] ?? null,
    damage_class: m.damage_class,
    power: m.power,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority ?? 0
  }));
  await upsertBatch('move', moves);
  console.log(`  → move ${moves.length}개 완료`);
  return files;
}

async function uploadPokemon() {
  console.log('[5/9] pokemon 업로드 중...');
  const files = readJsonFiles(path.join(DATA_DIR, 'pokemon'));
  const pokemon = files.map(p => ({
    id: p.id,
    name: p.name_en.toLowerCase().replace(/ /g, '-'),
    hp: p.stats.hp,
    attack: p.stats.attack,
    defense: p.stats.defense,
    sp_attack: p.stats.sp_attack,
    sp_defense: p.stats.sp_defense,
    speed: p.stats.speed
  }));
  await upsertBatch('pokemon', pokemon);
  console.log(`  → pokemon ${pokemon.length}개 완료`);
  return files;
}

async function uploadPokemonTypes(pokemonFiles, typeIndex) {
  console.log('[6/9] pokemon_type 업로드 중...');
  const rows = [];
  for (const p of pokemonFiles) {
    p.types.forEach((typeName, i) => {
      const typeId = typeIndex[typeName];
      if (typeId !== undefined) rows.push({ pokemon_id: p.id, type_id: typeId, slot: i + 1 });
    });
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('pokemon_type').upsert(batch, { onConflict: 'pokemon_id,slot' });
    if (error) throw new Error(`[pokemon_type] ${error.message}`);
  }
  console.log(`  → pokemon_type ${rows.length}개 완료`);
}

async function uploadPokemonAbilities(pokemonFiles, abilityFiles) {
  console.log('[7/9] pokemon_ability 업로드 중...');
  const abilityIndex = {};
  abilityFiles.forEach(a => { abilityIndex[a.slug] = a.id; });

  const rows = [];
  for (const p of pokemonFiles) {
    for (const ab of p.abilities) {
      const abilityId = abilityIndex[ab.name];
      if (abilityId !== undefined) {
        rows.push({ pokemon_id: p.id, ability_id: abilityId, is_hidden: ab.is_hidden, slot: ab.slot });
      }
    }
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('pokemon_ability').upsert(batch, { onConflict: 'pokemon_id,slot' });
    if (error) throw new Error(`[pokemon_ability] ${error.message}`);
  }
  console.log(`  → pokemon_ability ${rows.length}개 완료`);
}

async function uploadPokemonMoves(pokemonFiles, moveFiles) {
  console.log('[8/9] pokemon_move 업로드 중...');
  const moveIndex = {};
  moveFiles.forEach(m => { moveIndex[m.slug] = m.id; });

  const rows = [];
  for (const p of pokemonFiles) {
    for (const moveName of p.moves) {
      const moveId = moveIndex[moveName];
      if (moveId !== undefined) rows.push({ pokemon_id: p.id, move_id: moveId, game_version_id: null });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('pokemon_move').upsert(batch, { onConflict: 'pokemon_id,move_id,game_version_id' });
    if (error) throw new Error(`[pokemon_move] ${error.message}`);
  }
  console.log(`  → pokemon_move ${rows.length}개 완료`);
}

async function uploadTranslations(pokemonFiles, moveFiles, abilityFiles, typeFiles) {
  console.log('[9/9] translation 업로드 중...');
  const rows = [];

  const langs = [
    { code: 'ko', id: 2 },
    { code: 'en', id: 1 },
    { code: 'ja', id: 3 }
  ];

  for (const p of pokemonFiles) {
    for (const { code, id: langId } of langs) {
      const name = p[`name_${code}`] || p.name_en;
      if (name) rows.push({ language_id: langId, entity_type: 'pokemon', entity_id: p.id, field: 'name', value: name });
    }
  }

  for (const m of moveFiles) {
    for (const { code, id: langId } of langs) {
      const name = m[`name_${code}`] || m.name_en;
      const desc = m[`desc_${code}`];
      if (name) rows.push({ language_id: langId, entity_type: 'move', entity_id: m.id, field: 'name', value: name });
      if (desc) rows.push({ language_id: langId, entity_type: 'move', entity_id: m.id, field: 'desc', value: desc });
    }
  }

  for (const a of abilityFiles) {
    for (const { code, id: langId } of langs) {
      const name = a[`name_${code}`] || a.name_en;
      const desc = a[`desc_${code}`];
      if (name) rows.push({ language_id: langId, entity_type: 'ability', entity_id: a.id, field: 'name', value: name });
      if (desc) rows.push({ language_id: langId, entity_type: 'ability', entity_id: a.id, field: 'desc', value: desc });
    }
  }

  for (const t of typeFiles) {
    for (const { code, id: langId } of langs) {
      const name = t[`name_${code}`] || t.name_en;
      if (name) rows.push({ language_id: langId, entity_type: 'type', entity_id: t.id, field: 'name', value: name });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('translation').upsert(batch, { onConflict: 'language_id,entity_type,entity_id,field' });
    if (error) throw new Error(`[translation] ${error.message}`);
  }
  console.log(`  → translation ${rows.length}개 완료`);
}

async function main() {
  console.log('=== Supabase 데이터 업로드 시작 ===');

  const typeFiles = readJsonFiles(path.join(DATA_DIR, 'types'));
  const typeIndex = {};
  typeFiles.forEach(t => { typeIndex[t.name] = t.id; });

  // type, type_matchup, ability는 이미 업로드됨 — move부터 실행
  const abilityFiles = readJsonFiles(path.join(DATA_DIR, 'abilities'));
  const moveFiles = await uploadMoves(typeIndex);
  const pokemonFiles = await uploadPokemon();
  await uploadPokemonTypes(pokemonFiles, typeIndex);
  await uploadPokemonAbilities(pokemonFiles, abilityFiles);
  await uploadPokemonMoves(pokemonFiles, moveFiles);
  await uploadTranslations(pokemonFiles, moveFiles, abilityFiles, typeFiles);

  console.log('\n=== 모든 업로드 완료 ===');
}

main().catch(err => {
  console.error('업로드 실패:', err.message);
  process.exit(1);
});
