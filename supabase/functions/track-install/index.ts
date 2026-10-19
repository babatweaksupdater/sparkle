import { adminClient, cors } from '../_shared/admin.ts';

Deno.serve(async (request) => {
  const headers = cors(request);
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  const suppliedKey = request.headers.get('apikey') ?? '';
  let acceptedKeys: string[] = [];
  try {
    acceptedKeys = Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')) as string[];
  } catch { /* legacy anon key is checked below */ }
  const legacyAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!suppliedKey || (!acceptedKeys.includes(suppliedKey) && suppliedKey !== legacyAnonKey)) {
    return reply({ error: 'Invalid app key' }, 401);
  }

  try {
    const body = await request.json();
    const installId = String(body.installId ?? '');
    const plan = String(body.plan ?? 'Unknown');
    const appVersion = String(body.appVersion ?? '').slice(0, 32);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(installId)) {
      return reply({ error: 'Invalid installation id' }, 400);
    }
    if (!['Day', 'Month', 'Lifetime', 'Unknown'].includes(plan)) return reply({ error: 'Invalid plan' }, 400);

    // Derive only a country code. The source IP is used for this lookup and is not stored.
    let countryCode: string | null = null;
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) {
      try {
        const lookup = await fetch(`https://ipapi.co/${encodeURIComponent(forwarded)}/country/`, {
          signal: AbortSignal.timeout(3500),
          headers: { 'user-agent': 'BabaTweak-country-lookup/1.0' },
        });
        const candidate = (await lookup.text()).trim().toUpperCase();
        if (lookup.ok && /^[A-Z]{2}$/.test(candidate)) countryCode = candidate;
      } catch { /* country remains unknown */ }
    }

    const { error } = await adminClient().from('baba_installs').upsert({
      install_id: installId,
      country_code: countryCode,
      plan,
      app_version: appVersion || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'install_id' });
    if (error) throw error;
    if (countryCode) {
      const { error: licenseError } = await adminClient().from('baba_license_keys').update({ country_code: countryCode }).eq('claimed_install_id', installId);
      if (licenseError) throw licenseError;
    }
    return reply({ ok: true }, 200);
  } catch (error) {
    console.error('track-install failed', error);
    return reply({ error: 'Tracking request failed' }, 500);
  }
});

