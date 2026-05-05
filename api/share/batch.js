import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/batch');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { share_ids } = body;

    if (!share_ids || !Array.isArray(share_ids) || share_ids.length === 0) {
      return json({ error: '分享ID列表不能为空' }, 400);
    }
    if (share_ids.length > 100) {
      return json({ error: '分享ID列表长度不能超过100' }, 400);
    }

    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from('shared_cards')
        .select('share_id, hugs_count, ai_poem, mood_band')
        .in('share_id', share_ids);

      if (error) {
        console.error('Supabase batch query error:', error);
        return json({
          items: share_ids.map((sid) => ({
            share_id: sid,
            hugs_count: 0,
          })),
        });
      }

      const items = share_ids.map((sid) => {
        const found = data?.find((item) => item.share_id === sid);
        return {
          share_id: sid,
          hugs_count: found?.hugs_count ?? 0,
          ai_poem: found?.ai_poem ?? null,
          mood_band: found?.mood_band ?? null,
        };
      });

      return json({ items });
    }

    return json({
      items: share_ids.map((sid) => ({
        share_id: sid,
        hugs_count: 0,
      })),
    });
  } catch (err) {
    console.error('Batch hug error:', err);
    return json({ error: '批量查询失败' }, 500);
  }
}
