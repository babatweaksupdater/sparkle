import { adminClient, cors } from '../_shared/admin.ts';

const reply = (data: unknown, status = 200, headers: Record<string,string> = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
Deno.serve(async request => {
  const headers=cors(request);
  if(request.method==='OPTIONS') return new Response(null,{headers});
  if(request.method!=='POST') return reply({error:'Method not allowed'},405,headers);
  let accepted: string[]=[]; try { accepted=Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}')) as string[]; } catch {}
  const supplied=request.headers.get('apikey')||'';
  if(!supplied || (!accepted.includes(supplied) && supplied!==Deno.env.get('SUPABASE_ANON_KEY'))) return reply({error:'Invalid app key'},401,headers);
  try {
    const body=await request.json(); const key=String(body.key||'').trim().toUpperCase(); const installId=String(body.installId||'');
    if(key.length<12||key.length>120||!/^[A-Z0-9 -]+$/.test(key)) return reply({error:'Invalid key'},400,headers);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(installId)) return reply({error:'Invalid installation id'},400,headers);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const {data,error}=await adminClient().rpc('baba_claim_license',{p_key_hash:hash,p_install_id:installId});
    if(error) throw error; const result=Array.isArray(data)?data[0]:data;
    if(!result?.valid) return reply({valid:false,error:'Key ungültig, widerrufen oder bereits auf einem anderen Gerät aktiviert.'},200,headers);
    const duration=result.plan==='Day'?86400000:result.plan==='Month'?2592000000:0;
    return reply({valid:true,plan:result.plan,duration},200,headers);
  } catch(error) { console.error('validate-license failed',error); return reply({error:'Lizenzprüfung nicht verfügbar.'},500,headers); }
});
