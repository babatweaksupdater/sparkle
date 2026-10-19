import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { adminClient, cors } from '../_shared/admin.ts';

Deno.serve(async (request) => {
  const headers = cors(request);
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const apiKey = request.headers.get('apikey') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  if (!token || !apiKey) return reply({ error: 'Admin sign-in required' }, 401);

  try {
    const authClient = createClient(url, apiKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user?.email || user.email.toLowerCase() !== (Deno.env.get('BABA_ADMIN_EMAIL') ?? '').toLowerCase()) {
      return reply({ error: 'Not authorized' }, 403);
    }
    const { data, error } = await adminClient().rpc('baba_admin_stats');
    if (error) throw error;
    return reply(data);
  } catch (error) {
    console.error('admin-stats failed', error);
    return reply({ error: 'Could not load admin statistics' }, 500);
  }
});
