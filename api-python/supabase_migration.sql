-- Supabase Migration: shared_cards table
-- 话说APP V1.0 数据库初始化脚本

-- 创建分享卡片表
CREATE TABLE IF NOT EXISTS shared_cards (
  share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_poem TEXT NOT NULL,
  mood_band SMALLINT NOT NULL CHECK (mood_band IN (0, 1, 2)),
  hugs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hug_at TIMESTAMPTZ
);

-- 创建更新时间自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON shared_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建拥抱自增RPC函数
CREATE OR REPLACE FUNCTION increment_hug(target_share_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE shared_cards
  SET hugs_count = hugs_count + 1,
      last_hug_at = now()
  WHERE share_id = target_share_id
  RETURNING hugs_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS策略：启用行级安全
ALTER TABLE shared_cards ENABLE ROW LEVEL SECURITY;

-- 读取策略：任何人可按share_id单条读取
CREATE POLICY "Allow read by share_id"
  ON shared_cards FOR SELECT
  USING (true);

-- 插入策略：仅后端服务角色可插入
CREATE POLICY "Allow insert for service_role"
  ON shared_cards FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 更新策略：仅通过increment_hug RPC更新
CREATE POLICY "Allow update for service_role"
  ON shared_cards FOR UPDATE
  USING (auth.role() = 'service_role');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_shared_cards_created_at ON shared_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_cards_mood_band ON shared_cards(mood_band);
