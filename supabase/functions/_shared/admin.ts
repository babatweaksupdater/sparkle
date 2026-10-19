import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function cors(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  return {
    'access-control-allow-origin': origin.startsWith('file://') || origin === 'null' ? 'null' : origin,
    'access-control-allow-headers': 'authorization, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'vary': 'origin',
  };
}

export function secretKey() {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      const selected = keys.default ?? Object.values(keys)[0];
      if (selected) return selected;
    } catch { /* use legacy env var below */ }
  }
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  throw new Error('Missing Supabase secret key configuration');
}

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
