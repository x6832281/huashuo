import { getSupabase } from '../lib/supabase.js';
import { json, cors } from '../lib/response.js';
import { checkRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rateCheck = checkRateLimit(req, '/api/share/feed');
  if (!rateCheck.allowed) {
    return json({ error: rateCheck.message }, 429);
  }

  try {
    let mood_filter = null;
    let page = 1;
    let page_size = 20;

    if (req.method === 'POST') {
      const body = await req.json();
      mood_filter = body.mood_filter ?? null;
      page = body.page ?? 1;
      page_size = Math.min(body.page_size ?? 20, 50);
    } else {
      const url = new URL(req.url);
      mood_filter = url.searchParams.get('mood_filter');
      page = parseInt(url.searchParams.get('page') || '1');
      page_size = Math.min(parseInt(url.searchParams.get('page_size') || '20'), 50);
    }

    const supabase = getSupabase();

    if (supabase) {
      let query = supabase
        .from('square_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * page_size, page * page_size - 1);

      if (mood_filter !== null && mood_filter !== undefined && mood_filter !== '') {
        query = query.eq('mood_band', parseInt(mood_filter));
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase feed query error:', error);
        return json({ posts: [], total: 0, page, page_size });
      }

      return json({
        posts: data || [],
        total: count || 0,
        page,
        page_size,
      });
    }

    return json({ posts: [], total: 0, page, page_size });
  } catch (err) {
    console.error('Feed error:', err);
    return json({ error: '获取广场数据失败' }, 500);
  }
}
