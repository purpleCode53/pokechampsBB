-- ============================================================
-- 포케챔스 Supabase 스키마
-- ============================================================

-- ① language
CREATE TABLE language (
  id   SERIAL      PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,  -- 'ko', 'en', 'ja'
  name VARCHAR(50) NOT NULL
);

INSERT INTO language (code, name) VALUES
  ('en', 'English'),
  ('ko', '한국어'),
  ('ja', '日本語');

-- ② game_version
CREATE TABLE game_version (
  id         SERIAL      PRIMARY KEY,
  code       VARCHAR(50) NOT NULL UNIQUE,
  generation INTEGER
);

INSERT INTO game_version (code, generation) VALUES
  ('champions', NULL);

-- ③ type
CREATE TABLE type (
  id   INTEGER     PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE  -- PokeAPI 영문 slug (e.g. 'fire')
);

-- ④ type_matchup  (공격 타입 → 방어 타입 배율)
CREATE TABLE type_matchup (
  id               SERIAL         PRIMARY KEY,
  attacker_type_id INTEGER        NOT NULL REFERENCES type(id),
  defender_type_id INTEGER        NOT NULL REFERENCES type(id),
  multiplier       NUMERIC(4, 2)  NOT NULL,  -- 0 / 0.5 / 1 / 2
  UNIQUE (attacker_type_id, defender_type_id)
);

-- ⑤ ability
CREATE TABLE ability (
  id   INTEGER      PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE  -- PokeAPI 영문 slug
);

-- ⑥ move
CREATE TABLE move (
  id           INTEGER      PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,  -- PokeAPI 영문 slug
  type_id      INTEGER      REFERENCES type(id),
  damage_class VARCHAR(20),                   -- 'physical' / 'special' / 'status'
  power        INTEGER,
  accuracy     INTEGER,
  pp           INTEGER,
  priority     INTEGER      NOT NULL DEFAULT 0
);

-- ⑦ pokemon
CREATE TABLE pokemon (
  id         INTEGER      PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,  -- PokeAPI 영문 slug
  hp         INTEGER      NOT NULL,
  attack     INTEGER      NOT NULL,
  defense    INTEGER      NOT NULL,
  sp_attack  INTEGER      NOT NULL,
  sp_defense INTEGER      NOT NULL,
  speed      INTEGER      NOT NULL
);

-- ⑧ pokemon_type  (타입은 최대 2개, slot 1·2)
CREATE TABLE pokemon_type (
  id         SERIAL  PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
  type_id    INTEGER NOT NULL REFERENCES type(id),
  slot       INTEGER NOT NULL,
  UNIQUE (pokemon_id, slot)
);

-- ⑨ pokemon_ability
CREATE TABLE pokemon_ability (
  id         SERIAL   PRIMARY KEY,
  pokemon_id INTEGER  NOT NULL REFERENCES pokemon(id),
  ability_id INTEGER  NOT NULL REFERENCES ability(id),
  is_hidden  BOOLEAN  NOT NULL DEFAULT FALSE,
  slot       INTEGER  NOT NULL,
  UNIQUE (pokemon_id, slot)
);

-- ⑩ pokemon_move
CREATE TABLE pokemon_move (
  id              SERIAL  PRIMARY KEY,
  pokemon_id      INTEGER NOT NULL REFERENCES pokemon(id),
  move_id         INTEGER NOT NULL REFERENCES move(id),
  game_version_id INTEGER REFERENCES game_version(id),
  UNIQUE (pokemon_id, move_id, game_version_id)
);

-- ⑪ translation  (다국어 이름·설명 통합 테이블)
CREATE TABLE translation (
  id          SERIAL       PRIMARY KEY,
  language_id INTEGER      NOT NULL REFERENCES language(id),
  entity_type VARCHAR(50)  NOT NULL,  -- 'pokemon' / 'move' / 'ability' / 'type'
  entity_id   INTEGER      NOT NULL,
  field       VARCHAR(50)  NOT NULL,  -- 'name' / 'desc'
  value       TEXT         NOT NULL,
  UNIQUE (language_id, entity_type, entity_id, field)
);

-- ⑫ item
CREATE TABLE item (
  id   INTEGER      PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- ⑬ sample  (유저가 저장한 파티/배틀 샘플)
CREATE TABLE sample (
  id              SERIAL       PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  game_version_id INTEGER      REFERENCES game_version(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ⑭ sample_pokemon  (샘플 내 포켓몬 슬롯)
CREATE TABLE sample_pokemon (
  id         SERIAL  PRIMARY KEY,
  sample_id  INTEGER NOT NULL REFERENCES sample(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
  slot       INTEGER NOT NULL,  -- 1~6
  item_id    INTEGER REFERENCES item(id),
  ability_id INTEGER REFERENCES ability(id),
  UNIQUE (sample_id, slot)
);

-- ⑮ sample_pokemon_move  (샘플 포켓몬의 기술 슬롯)
CREATE TABLE sample_pokemon_move (
  id               SERIAL  PRIMARY KEY,
  sample_pokemon_id INTEGER NOT NULL REFERENCES sample_pokemon(id) ON DELETE CASCADE,
  move_id          INTEGER NOT NULL REFERENCES move(id),
  slot             INTEGER NOT NULL,  -- 1~4
  UNIQUE (sample_pokemon_id, slot)
);

-- ============================================================
-- RLS 활성화
-- ============================================================

ALTER TABLE language           ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_version       ENABLE ROW LEVEL SECURITY;
ALTER TABLE type               ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_matchup       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ability            ENABLE ROW LEVEL SECURITY;
ALTER TABLE move               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_type       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_ability    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_move       ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation        ENABLE ROW LEVEL SECURITY;
ALTER TABLE item               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_pokemon     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_pokemon_move ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 읽기 전용 정책 (anon / authenticated 모두 SELECT 허용)
-- ============================================================

CREATE POLICY "public read" ON language            FOR SELECT USING (true);
CREATE POLICY "public read" ON game_version        FOR SELECT USING (true);
CREATE POLICY "public read" ON type                FOR SELECT USING (true);
CREATE POLICY "public read" ON type_matchup        FOR SELECT USING (true);
CREATE POLICY "public read" ON ability             FOR SELECT USING (true);
CREATE POLICY "public read" ON move                FOR SELECT USING (true);
CREATE POLICY "public read" ON pokemon             FOR SELECT USING (true);
CREATE POLICY "public read" ON pokemon_type        FOR SELECT USING (true);
CREATE POLICY "public read" ON pokemon_ability     FOR SELECT USING (true);
CREATE POLICY "public read" ON pokemon_move        FOR SELECT USING (true);
CREATE POLICY "public read" ON translation         FOR SELECT USING (true);
CREATE POLICY "public read" ON item                FOR SELECT USING (true);
CREATE POLICY "public read" ON sample              FOR SELECT USING (true);
CREATE POLICY "public read" ON sample_pokemon      FOR SELECT USING (true);
CREATE POLICY "public read" ON sample_pokemon_move FOR SELECT USING (true);
