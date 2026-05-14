const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.POKEAPI_BASE_URL;
const OUTPUT_DIR = path.join(__dirname, '../data/abilities');
const DELAY_MS = 300;

const delay = ms => new Promise(r => setTimeout(r, ms));

function getName(names, lang) {
  const found = names.find(n => n.language.name === lang);
  return found ? found.name : null;
}

function getEffectText(entries, lang) {
  const found = entries.find(e => e.language.name === lang);
  return found ? found.effect : null;
}

function getFlavorText(entries, lang) {
  const found = entries.filter(e => e.language.name === lang);
  return found.length > 0 ? found[found.length - 1].flavor_text : null;
}

async function fetchAllAbilityNames() {
  let results = [];
  let url = `${BASE_URL}/ability?limit=100&offset=0`;
  while (url) {
    const res = await axios.get(url);
    results = results.concat(res.data.results);
    url = res.data.next;
    await delay(200);
  }
  return results;
}

async function fetchAbility(url) {
  const res = await axios.get(url);
  const a = res.data;

  return {
    id: a.id,
    slug: a.name,
    name_en: getName(a.names, 'en') || a.name,
    name_ko: getName(a.names, 'ko'),
    name_ja: getName(a.names, 'ja'),
    desc_en: getEffectText(a.effect_entries, 'en') || getFlavorText(a.flavor_text_entries, 'en'),
    desc_ko: getFlavorText(a.flavor_text_entries, 'ko') || getEffectText(a.effect_entries, 'en'),
    desc_ja: getFlavorText(a.flavor_text_entries, 'ja')
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('특성 목록 조회 중...');
  const abilities = await fetchAllAbilityNames();
  console.log(`총 ${abilities.length}개 특성 수집 시작`);

  let success = 0;
  let failed = [];

  for (let i = 0; i < abilities.length; i++) {
    const ab = abilities[i];
    try {
      const data = await fetchAbility(ab.url);
      fs.writeFileSync(path.join(OUTPUT_DIR, `${data.id}.json`), JSON.stringify(data, null, 2));
      success++;
      if ((i + 1) % 50 === 0) console.log(`[${i + 1}/${abilities.length}] 진행 중...`);
    } catch (err) {
      console.error(`[${ab.name}] 실패: ${err.message}`);
      failed.push(ab.name);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n완료: 성공 ${success}개, 실패 ${failed.length}개`);
  if (failed.length > 0) console.log('실패 목록:', failed);
}

main();
