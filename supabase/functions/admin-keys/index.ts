import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { adminClient, cors } from '../_shared/admin.ts';

const reply=(data:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{...headers,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function segment(){const bytes=crypto.getRandomValues(new Uint8Array(6));return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('')}
async function verifyAdmin(request:Request){
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');const apiKey=request.headers.get('apikey')||'';
  if(!token||!apiKey)return false;
  const auth=createClient(Deno.env.get('SUPABASE_URL')!,apiKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await auth.auth.getUser(token);
  return !error&&!!user?.email&&user.email.toLowerCase()===(Deno.env.get('BABA_ADMIN_EMAIL')||'').toLowerCase();
}
Deno.serve(async request=>{
 const headers=cors(request);if(request.method==='OPTIONS')return new Response(null,{headers});if(request.method!=='POST')return reply({error:'Method not allowed'},405,headers);
 try{
  if(!await verifyAdmin(request))return reply({error:'Admin sign-in required'},401,headers);
  const body=await request.json();const client=adminClient();
  if(body.action==='list'){
   const {data,error}=await client.rpc('baba_admin_list_license_keys');if(error)throw error;
   return reply({keys:data||[]},200,headers);
  }
  if(body.action==='create'){
   const plan=String(body.plan||'');if(!['Day','Month','Lifetime'].includes(plan))return reply({error:'Ungültiger Plan'},400,headers);
   const key=`Baba tweak ${plan}-${segment()}-${segment()}-${segment()}-${segment()}`;
   const hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key.toUpperCase()));
   const hash=Array.from(new Uint8Array(hashBytes),b=>b.toString(16).padStart(2,'0')).join('');
   const {data,error}=await client.rpc('baba_create_license_key',{p_key_hash:hash,p_key_hint:key.slice(-4),p_plan:plan});if(error)throw error;
   return reply({id:data,key},200,headers);
  }
  if(body.action==='revoke'){
   const id=String(body.id||'');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return reply({error:'Ungültige Key-ID'},400,headers);
   const {data,error}=await client.rpc('baba_revoke_license_key',{p_id:id});if(error)throw error;return reply({ok:Boolean(data)},200,headers);
  }
  return reply({error:'Unknown action'},400,headers);
 }catch(error){console.error('admin-keys failed',error);return reply({error:'Key-Verwaltung nicht verfügbar. Prüfe Migration und Edge Function Deployment.'},500,headers)}
});
