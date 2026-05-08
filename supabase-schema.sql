-- CooPet マルチプレイ用 Supabase スキーマ
-- Supabase Dashboard > SQL Editor で実行してください

-- ── テーブル作成 ──────────────────────────────

CREATE TABLE IF NOT EXISTS coopet_rooms (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_key   text NOT NULL,   -- 'dragon' | 'unicorn' | 'slime'
  pet_name  text NOT NULL,
  theme_id  text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coopet_state (
  room_id   uuid PRIMARY KEY REFERENCES coopet_rooms(id) ON DELETE CASCADE,
  hunger    float DEFAULT 70,
  happy     float DEFAULT 80,
  energy    float DEFAULT 60,
  xp        float DEFAULT 35,
  stage_idx int   DEFAULT 0,
  pts       float DEFAULT 185,
  style_a   float DEFAULT 0,
  style_b   float DEFAULT 0,
  style_c   float DEFAULT 0,
  bad_status text[] DEFAULT '{}',
  updated_by text  DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- ── RLS（誰でも読み書きOK：プロトタイプ用）────

ALTER TABLE coopet_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE coopet_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all rooms"  ON coopet_rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow all state"  ON coopet_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Realtime 有効化 ────────────────────────────
-- ※ Dashboard > Database > Replication でも設定可能
ALTER PUBLICATION supabase_realtime ADD TABLE coopet_state;
