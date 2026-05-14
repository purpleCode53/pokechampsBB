# 포케챔스 데이터 수집 설정 가이드

## 작업 환경
- **작업 폴더**: `C:\pokechampsBB`
- **Node.js**: v24.15.0
- **npm**: 11.12.1

---

## Claude Code 시작 방법

터미널(PowerShell)을 열고 아래 명령어 입력:

```bash
cd C:\pokechampsBB
claude
```

---

## Step 1. 프로젝트 초기화

Claude Code에 아래 내용을 요청하세요:

```
C:\pokechampsBB 폴더에서 데이터 수집 프로젝트를 초기화해줘.
아래 작업을 순서대로 진행해줘:

1. npm init -y 실행
2. 패키지 설치: npm install axios dotenv
3. 아래 구조로 폴더와 파일 생성:

pokechampsBB/
├── .env
├── .gitignore
├── scripts/
│   ├── fetch-pokemon.js
│   ├── fetch-moves.js
│   ├── fetch-abilities.js
│   └── fetch-types.js
└── data/
    ├── pokemon/
    ├── moves/
    ├── abilities/
    └── types/
```

---

## Step 2. .env 파일 설정

Claude Code에 요청:

```
.env 파일에 아래 내용을 작성해줘.
SUPABASE_URL과 SUPABASE_SERVICE_KEY는 내가 직접 입력할 거야:

SUPABASE_URL=여기에입력
SUPABASE_SERVICE_KEY=여기에입력
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
```

> ⚠️ Supabase 대시보드 → Settings → API 에서 값 복사 후 직접 입력

---

## Step 3. .gitignore 설정

Claude Code에 요청:

```
.gitignore 파일에 아래 내용을 작성해줘:

.env
node_modules/
data/
```

---

## Step 4. 포켓몬 데이터 수집 스크립트

Claude Code에 요청:

```
scripts/fetch-pokemon.js 파일을 작성해줘.
PokeAPI(https://pokeapi.co/api/v2)를 사용해서
아래 데이터를 수집하는 스크립트야:

수집할 데이터:
- 포켓몬 id, 이름(한국어/영어/일본어)
- 타입 (최대 2개)
- 종족값 (hp, attack, defense, sp_attack, sp_defense, speed)
- 배울 수 있는 기술 목록
- 특성 목록

결과는 data/pokemon/ 폴더에 JSON 파일로 저장
포켓몬 번호 1~1025번까지 수집
요청 간 딜레이 300ms 추가 (API 과부하 방지)
```

---

## Step 5. 기술 데이터 수집 스크립트

Claude Code에 요청:

```
scripts/fetch-moves.js 파일을 작성해줘.
PokeAPI에서 기술 데이터를 수집하는 스크립트야:

수집할 데이터:
- 기술 id, 이름(한국어/영어/일본어)
- 타입
- 분류 (물리/특수/변화)
- 위력, 명중률, PP
- 우선도 (priority)
- 설명(한국어/영어/일본어)

결과는 data/moves/ 폴더에 JSON으로 저장
요청 간 딜레이 300ms 추가
```

---

## Step 6. 특성 데이터 수집 스크립트

Claude Code에 요청:

```
scripts/fetch-abilities.js 파일을 작성해줘.
PokeAPI에서 특성 데이터를 수집하는 스크립트야:

수집할 데이터:
- 특성 id, 이름(한국어/영어/일본어)
- 설명(한국어/영어/일본어)

결과는 data/abilities/ 폴더에 JSON으로 저장
요청 간 딜레이 300ms 추가
```

---

## Step 7. 타입 상성 데이터 수집 스크립트

Claude Code에 요청:

```
scripts/fetch-types.js 파일을 작성해줘.
PokeAPI에서 타입 상성 데이터를 수집하는 스크립트야:

수집할 데이터:
- 타입 id, 이름(한국어/영어/일본어)
- 타입 간 상성 (0배/0.5배/1배/2배)

결과는 data/types/ 폴더에 JSON으로 저장
```

---

## Step 8. 스크립트 실행

Claude Code에 요청:

```
아래 순서로 스크립트를 실행해줘:

1. node scripts/fetch-types.js
2. node scripts/fetch-abilities.js
3. node scripts/fetch-moves.js
4. node scripts/fetch-pokemon.js

각 스크립트 실행 후 data/ 폴더에 JSON 파일이 생성되는지 확인해줘.
에러가 발생하면 수정해줘.
```

---

## Step 9. Supabase DB 스키마 생성

데이터 수집 완료 후 Claude Code에 요청:

```
수집한 JSON 데이터를 바탕으로
Supabase에 올릴 SQL 스키마 파일을 작성해줘.

파일명: schema.sql

포함할 테이블:
- language
- game_version
- type
- type_matchup
- ability
- pokemon
- pokemon_type
- pokemon_ability
- move
- pokemon_move
- translation
- item
- sample
- sample_pokemon
- sample_pokemon_move

앞서 설계한 DB 구조 기준으로 작성해줘.
RLS 활성화 및 읽기 전용 정책도 포함해줘.
```

---

## Step 10. Supabase에 스키마 적용

Claude Code에 요청:

```
schema.sql 파일을 Supabase에 적용하는 방법을 알려줘.
Supabase 대시보드의 SQL Editor를 사용할 거야.
```

---

## Step 11. 수집 데이터 Supabase에 업로드

Claude Code에 요청:

```
data/ 폴더의 JSON 파일을 읽어서
Supabase에 데이터를 삽입하는 스크립트를 작성해줘.

파일명: scripts/upload-to-supabase.js

.env의 SUPABASE_URL과 SUPABASE_SERVICE_KEY를 사용
@supabase/supabase-js 패키지 설치 후 사용
테이블 순서대로 삽입 (외래키 의존성 고려):
1. language
2. game_version
3. type
4. type_matchup
5. ability
6. move
7. pokemon
8. pokemon_type
9. pokemon_ability
10. pokemon_move
11. translation
```

---

## 참고 사항

### PokeAPI 한국어 데이터
- PokeAPI의 한국어 코드: `ko`
- 일본어 코드: `ja`
- 영어 코드: `en`
- 데이터가 없는 항목은 영어로 폴백 처리

### 포챔스 전용 데이터 (수동 입력 필요)
PokeAPI에 없는 포챔스 전용 데이터는 수집 후 직접 수정 필요:
- 포챔스에서만 배울 수 있는 기술
- 포챔스 전용 종족값 변경사항
- 포챔스 등장 포켓몬 목록 (일부 미등장 포켓몬 제외)

### game_version 기본 데이터
```sql
INSERT INTO game_version (code, generation) 
VALUES ('champions', NULL);
```

---

## 완료 체크리스트

```
□ Step 1: 프로젝트 초기화
□ Step 2: .env 파일 설정 (Supabase 키 입력)
□ Step 3: .gitignore 설정
□ Step 4: fetch-pokemon.js 작성
□ Step 5: fetch-moves.js 작성
□ Step 6: fetch-abilities.js 작성
□ Step 7: fetch-types.js 작성
□ Step 8: 스크립트 실행 및 데이터 수집
□ Step 9: schema.sql 작성
□ Step 10: Supabase 스키마 적용
□ Step 11: 데이터 업로드
```
