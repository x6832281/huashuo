import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

function generateShareId() {
  return crypto.randomUUID();
}

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/create');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { ai_poem, mood_band } = body;

    if (!ai_poem || ai_poem.trim().length === 0) {
      return json({ error: '诗句不能为空' }, 400);
    }
    if (![0, 1, 2].includes(mood_band)) {
      return json({ error: '情绪类型必须是0、1或2' }, 400);
    }

    const shareId = generateShareId();
    const supabase = getSupabase();

    if (!supabase) {
      return json({ error: '数据库未配置' }, 502);
    }

    const { error } = await supabase
      .from('shared_cards')
      .insert({
        share_id: shareId,
        ai_poem,
        mood_band,
        hugs_count: 0,
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return json({ error: '写入失败，请稍后重试' }, 502);
    }

    const origin = req.headers['origin'] || process.env.APP_BASE_URL || 'https://huashuo.app';

    return json({
      share_id: shareId,
      share_url: `${origin}/s/${shareId}`,
    });
  } catch (err) {
    console.error('Create share error:', err);
    return json({ error: '创建分享失败' }, 502);
  }
}
