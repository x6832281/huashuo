import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/like');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const body = await req.json();
    const { post_id, device_id } = body;

    if (!post_id) {
      return json({ error: '帖子ID不能为空' }, 400);
    }
    if (!device_id) {
      return json({ error: '设备ID不能为空' }, 400);
    }

    const supabase = getSupabase();
    if (!supabase) {
      return json({ error: '服务未配置' }, 503);
    }

    const { data: post, error: postError } = await supabase
      .from('square_posts')
      .select('id, hugs_count')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return json({ error: '帖子不存在' }, 404);
    }

    const { data: existingLike } = await supabase
      .from('square_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('device_id', device_id)
      .maybeSingle();

    if (existingLike) {
      return json({
        hugs_count: post.hugs_count,
        liked: true,
        message: '已经点过赞了',
      });
    }

    await supabase.from('square_likes').insert({
      post_id,
      device_id,
    });

    const { data: updatedPost } = await supabase
      .from('square_posts')
      .update({ hugs_count: post.hugs_count + 1 })
      .eq('id', post_id)
      .select('hugs_count')
      .single();

    return json({
      hugs_count: updatedPost?.hugs_count ?? post.hugs_count + 1,
      liked: true,
    });
  } catch (err) {
    console.error('Like error:', err);
    return json({ error: '点赞失败' }, 500);
  }
}
