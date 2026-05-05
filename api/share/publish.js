import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/publish');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { content_text, mood_band, nickname, emoji, share_id } = body;

    if (!content_text || content_text.trim().length === 0) {
      return json({ error: '心事内容不能为空' }, 400);
    }
    if (content_text.length > 1000) {
      return json({ error: '心事内容不能超过1000字符' }, 400);
    }
    if (![0, 1, 2].includes(mood_band)) {
      return json({ error: '情绪类型必须是0、1或2' }, 400);
    }

    const supabase = getSupabase();

    if (supabase) {
      const insertData = {
        content_text: content_text.trim(),
        mood_band,
        nickname: nickname || '匿名',
        emoji: emoji || '🌙',
      };

      if (share_id) {
        insertData.share_id = share_id;
      }

      const { data, error } = await supabase
        .from('square_posts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase publish error:', error);
        return json({ error: '发布失败' }, 500);
      }

      return json({ post: data });
    }

    return json({
      post: {
        id: Date.now().toString(36),
        content_text: content_text.trim(),
        mood_band,
        nickname: nickname || '匿名',
        emoji: emoji || '🌙',
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Publish error:', err);
    return json({ error: '发布失败' }, 500);
  }
}
