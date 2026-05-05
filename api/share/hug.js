import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/hug');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { share_id, device_id } = body;

    if (!share_id) {
      return json({ error: '分享ID不能为空' }, 400);
    }
    if (!device_id) {
      return json({ error: '设备ID不能为空' }, 400);
    }

    const supabase = getSupabase();

    if (supabase) {
      const { data: card, error: cardError } = await supabase
        .from('shared_cards')
        .select('share_id, hugs_count')
        .eq('share_id', share_id)
        .single();

      if (cardError || !card) {
        return json({ error: '分享卡片不存在' }, 404);
      }

      const { data: existingHug } = await supabase
        .from('hugs')
        .select('id')
        .eq('share_id', share_id)
        .eq('device_id', device_id)
        .maybeSingle();

      if (existingHug) {
        return json({
          hugs_count: card.hugs_count,
          message: '今日已拥抱',
        });
      }

      const { error: rpcError } = await supabase.rpc('increment_hug', {
        target_share_id: share_id,
      });

      if (rpcError) {
        const { error: updateError } = await supabase
          .from('shared_cards')
          .update({
            hugs_count: card.hugs_count + 1,
            last_hug_at: new Date().toISOString(),
          })
          .eq('share_id', share_id);

        if (updateError) {
          console.error('Update hugs_count error:', updateError);
          return json({ error: '拥抱失败' }, 500);
        }
      }

      await supabase.from('hugs').insert({
        share_id,
        device_id,
      });

      const { data: updatedCard } = await supabase
        .from('shared_cards')
        .select('hugs_count')
        .eq('share_id', share_id)
        .single();

      return json({
        hugs_count: updatedCard?.hugs_count ?? card.hugs_count + 1,
      });
    }

    return json({ hugs_count: 1 });
  } catch (err) {
    console.error('Hug error:', err);
    return json({ error: '拥抱失败' }, 500);
  }
}
