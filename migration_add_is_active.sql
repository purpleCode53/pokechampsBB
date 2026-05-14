-- pokemon, ability, move 테이블에 is_active 컬럼 추가
-- 기본값 true (현재 모든 항목 노출)
-- 포케챔스 미등장 항목은 false로 수동 변경

ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ability ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE move    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 관리 편의를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_pokemon_is_active ON pokemon(is_active);
CREATE INDEX IF NOT EXISTS idx_ability_is_active ON ability(is_active);
CREATE INDEX IF NOT EXISTS idx_move_is_active    ON move(is_active);
