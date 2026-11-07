import { Auth } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import { getToken } from '@auth/core/jwt';
import { readFile } from 'node:fs/promises';

const REPO='ykimran/ykimran.github.io';
const OWNER_ID='85554274';
const CONTENT_URL=`https://api.github.com/repos/${REPO}/contents/index.html`;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const configured=()=>Boolean(process.env.AUTH_SECRET&&process.env.AUTH_GITHUB_ID&&process.env.AUTH_GITHUB_SECRET&&process.env.APP_ORIGIN);
export function config(){return {
 secret:process.env.AUTH_SECRET,trustHost:true,basePath:'/api/auth',useSecureCookies:true,
 providers:[GitHub({clientId:process.env.AUTH_GITHUB_ID,clientSecret:process.env.AUTH_GITHUB_SECRET,checks:['pkce','state'],authorization:{params:{scope:'read:user public_repo'}}})],
 session:{strategy:'jwt',maxAge:4*60*60},
 callbacks:{
  async signIn({profile}){return String(profile?.id)===OWNER_ID;},
  async jwt({token,account,profile}){if(account){token.githubId=String(profile?.id);token.githubToken=account.access_token;}return token;},
  async session({session,token}){session.user.githubId=token.githubId;return session;},
  async redirect({url,baseUrl}){try{const target=new URL(url,baseUrl);return target.origin===baseUrl?target.href:baseUrl+'/admin';}catch{return baseUrl+'/admin';}}
 },
 logger:{error(error){console.error('Authentication error:',error.type||'unknown');}}
};}
export async function session(request){
 if(!configured())return null;
 // Accept only the encrypted HttpOnly cookie; do not accept arbitrary bearer tokens.
 const headers=new Headers();if(request.headers.get('cookie'))headers.set('cookie',request.headers.get('cookie'));
 const token=await getToken({req:{headers},secret:process.env.AUTH_SECRET,secureCookie:true});
 return token?.githubId===OWNER_ID&&typeof token.githubToken==='string'&&token.githubToken?token:null;
}
export async function githubContent(token,method='GET',body){
 const response=await fetch(CONTENT_URL+(method==='GET'?'?ref=main':''),{method,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token.githubToken}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'ykimran-portfolio-admin',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!response.ok){const e=Error(response.status===409?'The repository changed. Export a backup and refresh.':response.status===401||response.status===403?'GitHub access expired or was denied. Sign out and sign in again.':'GitHub is unavailable. Your draft is safe.');e.status=response.status===409?409:502;throw e;}
 return response.json();
}
function page(title,body){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Portfolio Studio</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"><style>body{margin:0;background:#0b1115;color:#edf2ed;font:16px/1.8 'Plus Jakarta Sans',sans-serif;min-height:100svh;display:grid;place-items:center}main{width:min(560px,calc(100% - 44px));padding:48px 0}small{color:#bce5aa;letter-spacing:3px;font-size:11px}h1{font-size:clamp(38px,9vw,60px);line-height:1.1;letter-spacing:-.05em;font-weight:600}p{color:#a4b5aa}a,button{display:inline-block;background:#bce5aa;color:#142116;border:0;border-radius:10px;padding:14px 22px;text-decoration:none;font:600 14px 'Plus Jakarta Sans',sans-serif}code{overflow-wrap:anywhere;color:#bce5aa}li{margin-bottom:10px}.secondary{background:none;color:#bce5aa;padding-left:0}</style></head><body><main><small>YK / PRIVATE CONTENT STUDIO</small>${body}</main></body></html>`;}
function reply(body,status=200,type='text/html; charset=utf-8'){return new Response(body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"}});}
const json=(value,status=200)=>reply(JSON.stringify(value),status,'application/json; charset=utf-8');
export async function handle(request){
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','POST','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
 if(path==='/health')return json({ok:true,configured:configured()});
 if(path==='/'||path==='/login'){
  const body=configured()?`<h1>Your next chapter starts here.</h1><p>Sign in with GitHub to update your portfolio. Only the owner account, <strong>ykimran</strong>, can access the editor.</p><a href="/api/auth/signin?callbackUrl=%2Fadmin">Sign in with GitHub ↗</a><p><a class="secondary" href="https://ykimran.github.io/">Back to portfolio</a></p>`:`<h1>Your studio is ready for setup.</h1><p>GitHub sign-in is not active yet. The owner needs to register an OAuth app and configure its credentials in Vercel.</p><p>Homepage URL:<br><code>${escapeHTML(process.env.APP_ORIGIN||url.origin)}</code></p><p>Authorization callback URL:<br><code>${escapeHTML(process.env.APP_ORIGIN||url.origin)}/api/auth/callback/github</code></p><p>Store the client ID as <code>AUTH_GITHUB_ID</code> and the client secret as <code>AUTH_GITHUB_SECRET</code> in Vercel’s Production environment, then redeploy.</p><a class="secondary" href="https://ykimran.github.io/">Back to portfolio</a>`;
  return reply(page('Sign in',body));
 }
 if(!configured())return path==='/admin'?Response.redirect(new URL('/',url),303):json({error:'GitHub sign-in requires owner setup.'},503);
 const allowedOrigin=new URL(process.env.APP_ORIGIN).origin;
 if(url.origin!==allowedOrigin)return json({error:'Use the production dashboard address.'},400);
 if(path.startsWith('/api/auth/')){
  const response=await Auth(request,config());
  response.headers.set('Cache-Control','no-store, private');return response;
 }
 if(path!=='/admin'&&path!=='/api/content')return json({error:'Not found'},404);
 const token=await session(request);
 if(!token)return path==='/admin'?Response.redirect(new URL('/',url),303):json({error:'Sign in with the owner GitHub account.'},401);
 if(path==='/admin'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const file=await githubContent(token),source=Buffer.from(file.content,'base64').toString('utf8');
  const js=await readFile(new URL('../private/studio.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../private/studio.css',import.meta.url),'utf8');
  const extra=`<script id="public-template" type="application/json">${JSON.stringify(source).replace(/</g,'\\u003c')}</script><style>${css}</style><script>${js}</script>`;
  return reply(source.replace('</body>',extra+'</body>'));
 }
 if(request.method==='GET')return json(await githubContent(token));
 if(request.method!=='PUT')return json({error:'Method not allowed'},405);
 if(request.headers.get('origin')!==allowedOrigin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Invalid publishing request origin.'},403);
 let body;try{const raw=await request.text();if(raw.length>1500000)return json({error:'Website is too large.'},413);body=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
 if(typeof body.content!=='string'||typeof body.sha!=='string'||!/^[a-f0-9]{40}$/.test(body.sha)||!/^[A-Za-z0-9+/=]+$/.test(body.content))return json({error:'Invalid website content.'},400);
 const content=Buffer.from(body.content,'base64').toString('utf8');
 if(Buffer.byteLength(content)>1000000||!content.includes('id="portfolio-data"'))return json({error:'Invalid or oversized portfolio file.'},400);
 const saved=await githubContent(token,'PUT',{message:'Update portfolio from authenticated content studio',content:body.content,sha:body.sha,branch:'main'});
 return json({commit_sha:saved.commit.sha});
}
export default async function handler(req,res){
 try{
  const route=typeof req.query?.route==='string'?req.query.route:'';
  const origin=process.env.APP_ORIGIN||`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'localhost'}`;
  const incoming=new URL(req.url,origin);
  const path=route?'/'+route:incoming.pathname;
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
  const query=new URLSearchParams(incoming.search);query.delete('route');
  const target=new URL(path+(query.size?'?'+query.toString():''),origin);
  let body;
  if(req.method!=='GET'&&req.method!=='HEAD'){
   if(req.body!==undefined)body=typeof req.body==='string'||Buffer.isBuffer(req.body)?req.body:headers.get('content-type')?.includes('application/x-www-form-urlencoded')?new URLSearchParams(req.body).toString():JSON.stringify(req.body);
   else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1500000){res.statusCode=413;res.end('Request too large');return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
  }
  const response=await handle(new Request(target,{method:req.method,headers,body}));
  res.statusCode=response.status;for(const [key,value]of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
  const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error('Dashboard request failed:',error.status||'internal');res.statusCode=error.status||500;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:error.status?error.message:'The dashboard could not complete the request. Your draft is safe.'}));}
}
