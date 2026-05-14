const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.POKEAPI_BASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../data/moves');
const DELAY_MS = 300;

const delay = ms => new Promise(r => setTimeout(r, ms));

function getName(names, lang) {
  const found = names.find(n => n.language.name === lang);
  return found ? found.name : null;
}

function getFlavorText(entries, lang) {
  const found = entries.filter(e => e.language.name === lang);
  return found.length > 0 ? found[found.length - 1].flavor_text : null;
}

async function fetchAllMoveNames() {
  let results = [];
  let url = `${BASE_URL}/move?limit=100&offset=0`;
  while (url) {
    const res = await axios.get(url);
    results = results.concat(res.data.results);
    url = res.data.next;
    await delay(200);
  }
  return results;
}

async function fetchMove(url) {
  const res = await axios.get(url);
  const m = res.data;

  const name_en = getName(m.names, 'en') || m.name;
  const name_ko = getName(m.names, 'ko');
  const name_ja = getName(m.names, 'ja');

  const desc_en = getFlavorText(m.flavor_text_entries, 'en');
  const desc_ko = getFlavorText(m.flavor_text_entries, 'ko');
  const desc_ja = getFlavorText(m.flavor_text_entries, 'ja');

  return {
    id: m.id,
    slug: m.name,
    name_en,
    name_ko,
    name_ja,
    type: m.type.name,
    damage_class: m.damage_class ? m.damage_class.name : null,
    power: m.power,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority,
    desc_en,
    desc_ko: desc_ko || desc_en,
    desc_ja
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('기술 목록 조회 중...');
  const moves = await fetchAllMoveNames();
  console.log(`총 ${moves.length}개 기술 수집 시작`);

  let success = 0;
  let failed = [];

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    try {
      const data = await fetchMove(m.url);
      fs.writeFileSync(path.join(OUTPUT_DIR, `${data.id}.json`), JSON.stringify(data, null, 2));
      success++;
      if ((i + 1) % 50 === 0) console.log(`[${i + 1}/${moves.length}] 진행 중...`);
    } catch (err) {
      console.error(`[${m.name}] 실패: ${err.message}`);
      failed.push(m.name);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${failed.length}개`);
  if (failed.length > 0) console.log('실패 목록:', failed);
}

main();
