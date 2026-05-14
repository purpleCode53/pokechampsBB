const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.POKEAPI_BASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../data/pokemon');
const DELAY_MS = 300;

const delay = ms => new Promise(r => setTimeout(r, ms));

function getName(names, lang) {
  const found = names.find(n => n.language.name === lang);
  return found ? found.name : null;
}

function parseMegaSuffix(slug) {
  // charizard-mega-x → { base: 'charizard', suffix: ' X' }
  // venusaur-mega    → { base: 'venusaur', suffix: '' }
  // absol-mega-z     → { base: 'absol', suffix: ' Z' }
  // magearna-original-mega → { base: 'magearna', suffix: ' (오리지널)' }
  // tatsugiri-curly-mega   → { base: 'tatsugiri', suffix: ' (곱슬)' }
  const suffixMap = {
    x: ' X', y: ' Y', z: ' Z',
  };
  const formMap = {
    curly: ' (곱슬)', droopy: ' (처진)', stretchy: ' (늘어진)', original: ' (오리지널)',
  };

  const parts = slug.split('-');
  const megaIdx = parts.lastIndexOf('mega');
  const base = parts.slice(0, megaIdx).join('-');
  const after = parts.slice(megaIdx + 1);

  let suffix = '';
  for (const a of after) {
    if (suffixMap[a]) suffix += suffixMap[a];
    else if (formMap[a]) suffix += formMap[a];
  }
  return { base, suffix };
}

async function fetchAllMegaNames() {
  let results = [];
  let url = `${BASE_URL}/pokemon?limit=200&offset=1025`;
  while (url) {
    const res = await axios.get(url);
    results = results.concat(res.data.results);
    url = res.data.next;
    await delay(200);
  }
  return results.filter(p => p.name.includes('mega'));
}

async function fetchMegaPokemon(slug) {
  const pokeRes = await axios.get(`${BASE_URL}/pokemon/${slug}`);
  const poke = pokeRes.data;

  // 종족 데이터는 기본형 포켓몬 기준
  const speciesUrl = poke.species.url;
  const speciesRes = await axios.get(speciesUrl);
  const species = speciesRes.data;

  const { base, suffix } = parseMegaSuffix(slug);

  const baseNameKo = getName(species.names, 'ko');
  const baseNameJa = getName(species.names, 'ja');
  const baseNameEn = getName(species.names, 'en') || base;

  const stats = {};
  for (const s of poke.stats) {
    const key = s.stat.name.replace('-', '_');
    stats[key] = s.base_stat;
  }

  return {
    id: poke.id,
    slug,
    name_en: `Mega ${baseNameEn}${suffix}`,
    name_ko: baseNameKo ? `메가${baseNameKo}${suffix}` : null,
    name_ja: baseNameJa ? `メガ${baseNameJa}${suffix}` : null,
    is_mega: true,
    types: poke.types.map(t => t.type.name),
    stats: {
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      sp_attack: stats['special_attack'],
      sp_defense: stats['special_defense'],
      speed: stats.speed,
    },
    abilities: poke.abilities.map(a => ({
      name: a.ability.name,
      is_hidden: a.is_hidden,
      slot: a.slot,
    })),
    moves: poke.moves.map(m => m.move.name),
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('메가진화 포켓몬 목록 조회 중...');
  const megaList = await fetchAllMegaNames();
  console.log(`총 ${megaList.length}개 메가진화 수집 시작\n`);

  let success = 0;
  const failed = [];

  for (let i = 0; i < megaList.length; i++) {
    const { name } = megaList[i];
    try {
      const data = await fetchMegaPokemon(name);
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${data.id}.json`),
        JSON.stringify(data, null, 2)
      );
      success++;
      console.log(`[${i + 1}/${megaList.length}] ${name} (id: ${data.id}) → ${data.name_ko ?? data.name_en}`);
    } catch (err) {
      console.error(`[${name}] 실패: ${err.message}`);
      failed.push(name);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${failed.length}개`);
  if (failed.length > 0) console.log('실패 목록:', failed);
}

main();
