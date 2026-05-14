const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.POKEAPI_BASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../data/pokemon');
const DELAY_MS = 300;
const TOTAL = 1025;

const delay = ms => new Promise(r => setTimeout(r, ms));

function getName(names, lang) {
  const found = names.find(n => n.language.name === lang);
  return found ? found.name : null;
}

async function fetchPokemon(id) {
  const [pokeRes, speciesRes] = await Promise.all([
    axios.get(`${BASE_URL}/pokemon/${id}`),
    axios.get(`${BASE_URL}/pokemon-species/${id}`)
  ]);

  const poke = pokeRes.data;
  const species = speciesRes.data;

  const stats = {};
  for (const s of poke.stats) {
    const key = s.stat.name.replace('-', '_');
    stats[key] = s.base_stat;
  }

  return {
    id: poke.id,
    name_en: getName(species.names, 'en') || poke.name,
    name_ko: getName(species.names, 'ko'),
    name_ja: getName(species.names, 'ja'),
    types: poke.types.map(t => t.type.name),
    stats: {
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      sp_attack: stats['special_attack'],
      sp_defense: stats['special_defense'],
      speed: stats.speed
    },
    abilities: poke.abilities.map(a => ({
      name: a.ability.name,
      is_hidden: a.is_hidden,
      slot: a.slot
    })),
    moves: poke.moves.map(m => m.move.name)
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = [];

  for (let id = 1; id <= TOTAL; id++) {
    try {
      const data = await fetchPokemon(id);
      fs.writeFileSync(path.join(OUTPUT_DIR, `${id}.json`), JSON.stringify(data, null, 2));
      success++;
      if (id % 50 === 0) console.log(`[${id}/${TOTAL}] 진행 중...`);
    } catch (err) {
      console.error(`[${id}] 실패: ${err.message}`);
      failed.push(id);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${failed.length}개`);
  if (failed.length > 0) console.log('실패 목록:', failed);
}

main();
