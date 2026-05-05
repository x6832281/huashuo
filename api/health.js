import { json, cors } from './lib/response.js';
import { getSupabase } from './lib/supabase.js';

export default async function handler(req) {
  const corsResponse = cors(req);
  if (corsResponse) return corsResponse;

  const supabase = getSupabase();
  const supabaseStatus = supabase ? 'connected' : 'not_configured';

  return json({
    status: 'healthy',
    supabase: supabaseStatus,
    ai: process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
}
