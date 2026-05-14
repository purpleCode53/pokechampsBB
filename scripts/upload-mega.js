const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DATA_DIR = path.join(__dirname, '../data/pokemon');
const BATCH_SIZE = 500;

// 메가진화 ID 범위 (10033 ~)
function readMegaFiles() {
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')))
    .filter(p => p.is_mega === true);
}

async function upsertBatch(table, rows, conflictCol) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictCol });
    if (error) throw new Error(`[${table}] ${error.message}`);
  }
}

async function main() {
  console.log('=== 메가진화 Supabase 업로드 시작 ===\n');

  const megaFiles = readMegaFiles();
  console.log(`메가진화 파일 수: ${megaFiles.length}개`);

  // 기존 타입/특성/기술 인덱스 조회
  const { data: types } = await supabase.from('type').select('id, name');
  const { data: abilities } = await supabase.from('ability').select('id, name');
  const { data: moves } = await supabase.from('move').select('id, name');

  const typeIndex = Object.fromEntries((types ?? []).map(t => [t.name, t.id]));
  const abilityIndex = Object.fromEntries((abilities ?? []).map(a => [a.name, a.id]));
  const moveIndex = Object.fromEntries((moves ?? []).map(m => [m.name, m.id]));

  // 1. pokemon
  console.log('[1/5] pokemon 업로드 중...');
  const pokemonRows = megaFiles.map(p => ({
    id: p.id,
    name: p.slug,
    hp: p.stats.hp,
    attack: p.stats.attack,
    defense: p.stats.defense,
    sp_attack: p.stats.sp_attack,
    sp_defense: p.stats.sp_defense,
    speed: p.stats.speed,
  }));
  await upsertBatch('pokemon', pokemonRows, 'id');
  console.log(`  → ${pokemonRows.length}개 완료`);

  // 2. pokemon_type
  console.log('[2/5] pokemon_type 업로드 중...');
  const typeRows = [];
  for (const p of megaFiles) {
    p.types.forEach((typeName, i) => {
      const typeId = typeIndex[typeName];
      if (typeId) typeRows.push({ pokemon_id: p.id, type_id: typeId, slot: i + 1 });
    });
  }
  await upsertBatch('pokemon_type', typeRows, 'pokemon_id,slot');
  console.log(`  → ${typeRows.length}개 완료`);

  // 3. pokemon_ability
  console.log('[3/5] pokemon_ability 업로드 중...');
  const abilityRows = [];
  for (const p of megaFiles) {
    for (const ab of p.abilities) {
      const abilityId = abilityIndex[ab.name];
      if (abilityId) abilityRows.push({ pokemon_id: p.id, ability_id: abilityId, is_hidden: ab.is_hidden, slot: ab.slot });
    }
  }
  await upsertBatch('pokemon_ability', abilityRows, 'pokemon_id,slot');
  console.log(`  → ${abilityRows.length}개 완료`);

  // 4. pokemon_move
  console.log('[4/5] pokemon_move 업로드 중...');
  const moveRows = [];
  for (const p of megaFiles) {
    for (const moveName of p.moves) {
      const moveId = moveIndex[moveName];
      if (moveId) moveRows.push({ pokemon_id: p.id, move_id: moveId, game_version_id: null });
    }
  }
  await upsertBatch('pokemon_move', moveRows, 'pokemon_id,move_id,game_version_id');
  console.log(`  → ${moveRows.length}개 완료`);

  // 5. translation
  console.log('[5/5] translation 업로드 중...');
  const langs = [{ code: 'ko', id: 2 }, { code: 'en', id: 1 }, { code: 'ja', id: 3 }];
  const trRows = [];
  for (const p of megaFiles) {
    for (const { code, id: langId } of langs) {
      const name = p[`name_${code}`] || p.name_en;
      if (name) trRows.push({ language_id: langId, entity_type: 'pokemon', entity_id: p.id, field: 'name', value: name });
    }
  }
  await upsertBatch('translation', trRows, 'language_id,entity_type,entity_id,field');
  console.log(`  → ${trRows.length}개 완료`);

  console.log('\n=== 메가진화 업로드 완료 ===');
}

main().catch(err => {
  console.error('업로드 실패:', err.message);
  process.exit(1);
});
