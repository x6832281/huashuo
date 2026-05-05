import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/comment');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return json({ error: '服务未配置' }, 503);
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const post_id = url.searchParams.get('post_id');
      if (!post_id) {
        return json({ error: '帖子ID不能为空' }, 400);
      }

      const { data, error } = await supabase
        .from('square_comments')
        .select('*')
        .eq('post_id', post_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase comment query error:', error);
        return json({ comments: [] });
      }

      return json({ comments: data || [] });
    }

    const body = await req.json();
    const { post_id, content, nickname, emoji } = body;

    if (!post_id) {
      return json({ error: '帖子ID不能为空' }, 400);
    }
    if (!content || content.trim().length === 0) {
      return json({ error: '评论内容不能为空' }, 400);
    }
    if (content.length > 500) {
      return json({ error: '评论内容不能超过500字符' }, 400);
    }

    const { data, error } = await supabase
      .from('square_comments')
      .insert({
        post_id,
        content: content.trim(),
        nickname: nickname || '匿名',
        emoji: emoji || '🌙',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase comment insert error:', error);
      return json({ error: '评论失败' }, 500);
    }

    await supabase.rpc('increment_post_comments', { target_post_id: post_id });

    return json({ comment: data });
  } catch (err) {
    console.error('Comment error:', err);
    return json({ error: '评论失败' }, 500);
  }
}
