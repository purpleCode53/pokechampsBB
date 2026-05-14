const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.POKEAPI_BASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../data/types');
const DELAY_MS = 300;

const delay = ms => new Promise(r => setTimeout(r, ms));

function getName(names, lang) {
  const found = names.find(n => n.language.name === lang);
  return found ? found.name : null;
}

async function fetchType(url) {
  const res = await axios.get(url);
  const t = res.data;

  const matchup = {
    no_damage_to: t.damage_relations.no_damage_to.map(x => x.name),
    half_damage_to: t.damage_relations.half_damage_to.map(x => x.name),
    double_damage_to: t.damage_relations.double_damage_to.map(x => x.name),
    no_damage_from: t.damage_relations.no_damage_from.map(x => x.name),
    half_damage_from: t.damage_relations.half_damage_from.map(x => x.name),
    double_damage_from: t.damage_relations.double_damage_from.map(x => x.name)
  };

  return {
    id: t.id,
    name: t.name,
    name_en: getName(t.names, 'en') || t.name,
    name_ko: getName(t.names, 'ko'),
    name_ja: getName(t.names, 'ja'),
    matchup
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('타입 목록 조회 중...');
  const res = await axios.get(`${BASE_URL}/type?limit=100`);
  const types = res.data.results;
  console.log(`총 ${types.length}개 타입 수집 시작`);

  let success = 0;
  let failed = [];

  for (let i = 0; i < types.length; i++) {
    const tp = types[i];
    try {
      const data = await fetchType(tp.url);
      fs.writeFileSync(path.join(OUTPUT_DIR, `${data.id}.json`), JSON.stringify(data, null, 2));
      success++;
      console.log(`[${data.name}] 저장 완료`);
    } catch (err) {
      console.error(`[${tp.name}] 실패: ${err.message}`);
      failed.push(tp.name);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${failed.length}개`);
  if (failed.length > 0) console.log('실패 목록:', failed);
}

main();
