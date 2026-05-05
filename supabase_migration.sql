CREATE TABLE IF NOT EXISTS shared_cards (
  share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_poem TEXT NOT NULL,
  mood_band SMALLINT NOT NULL CHECK (mood_band IN (0, 1, 2)),
  hugs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hug_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON shared_cards;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON shared_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS hugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES shared_cards(share_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(share_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_hugs_share_id ON hugs(share_id);
CREATE INDEX IF NOT EXISTS idx_hugs_device_id ON hugs(device_id);

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

ALTER TABLE shared_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE hugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read by share_id" ON shared_cards;
CREATE POLICY "Allow read by share_id"
  ON shared_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert for service_role" ON shared_cards;
CREATE POLICY "Allow insert for service_role"
  ON shared_cards FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow update for service_role" ON shared_cards;
CREATE POLICY "Allow update for service_role"
  ON shared_cards FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow read hugs" ON hugs;
CREATE POLICY "Allow read hugs"
  ON hugs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert hugs for service_role" ON hugs;
CREATE POLICY "Allow insert hugs for service_role"
  ON hugs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_shared_cards_created_at ON shared_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_cards_mood_band ON shared_cards(mood_band);

-- ==================== 广场功能 ====================

CREATE TABLE IF NOT EXISTS square_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shared_cards(share_id) ON DELETE SET NULL,
  content_text TEXT NOT NULL,
  mood_band SMALLINT NOT NULL CHECK (mood_band IN (0, 1, 2)),
  nickname TEXT NOT NULL DEFAULT '匿名',
  emoji TEXT NOT NULL DEFAULT '🌙',
  hugs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_square_posts_created_at ON square_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_square_posts_mood_band ON square_posts(mood_band);

DROP TRIGGER IF EXISTS set_updated_at_square ON square_posts;

ALTER TABLE square_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read square_posts" ON square_posts;
CREATE POLICY "Allow read square_posts"
  ON square_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert square_posts for service_role" ON square_posts;
CREATE POLICY "Allow insert square_posts for service_role"
  ON square_posts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ==================== 广场评论 ====================

CREATE TABLE IF NOT EXISTS square_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名',
  emoji TEXT NOT NULL DEFAULT '🌙',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_square_comments_post_id ON square_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_square_comments_created_at ON square_comments(created_at DESC);

ALTER TABLE square_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read square_comments" ON square_comments;
CREATE POLICY "Allow read square_comments"
  ON square_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert square_comments for service_role" ON square_comments;
CREATE POLICY "Allow insert square_comments for service_role"
  ON square_comments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ==================== 广场点赞 ====================

CREATE TABLE IF NOT EXISTS square_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_square_likes_post_id ON square_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_square_likes_device_id ON square_likes(device_id);

ALTER TABLE square_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read square_likes" ON square_likes;
CREATE POLICY "Allow read square_likes"
  ON square_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert square_likes for service_role" ON square_likes;
CREATE POLICY "Allow insert square_likes for service_role"
  ON square_likes FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ==================== 评论计数函数 ====================

CREATE OR REPLACE FUNCTION increment_post_comments(target_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_count
  FROM square_comments
  WHERE post_id = target_post_id;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
