import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from '@auth/core/jwt';
import { handle,config } from '../api/handler.js';
process.env.APP_ORIGIN='https://studio.example.com';
process.env.AUTH_SECRET='test-secret-only-not-a-deployed-credential-1234567890';
process.env.AUTH_GITHUB_ID='test-client';process.env.AUTH_GITHUB_SECRET='test-client-secret';
const origin=process.env.APP_ORIGIN;
async function cookie(githubId='85554274') {const name='__Secure-authjs.session-token';return `${name}=${await encode({secret:process.env.AUTH_SECRET,salt:name,token:{githubId,githubToken:'test-github-token'},maxAge:60})}`;}
test('anonymous users cannot retrieve editor or repository contents',async()=>{
 assert.equal((await handle(new Request(origin+'/admin'))).status,303);
 assert.equal((await handle(new Request(origin+'/api/content'))).status,401);
});
test('owner authorization uses stable GitHub ID and rejects other accounts',async()=>{
 assert.equal(await config().callbacks.signIn({profile:{id:85554274}}),true);
 assert.equal(await config().callbacks.signIn({profile:{id:123,login:'ykimran'}}),false);
 assert.equal((await handle(new Request(origin+'/api/content',{headers:{cookie:await cookie('123')}}))).status,401);
});
test('access token is not included in the browser session response',async()=>{
 const session=await config().callbacks.session({session:{user:{}},token:{githubId:'85554274',githubToken:'private'}});
 assert.equal(JSON.stringify(session).includes('private'),false);
});
test('publishing rejects cross-origin and missing-origin requests',async()=>{
 for(const o of [undefined,'https://attacker.example']){
  const headers={'Content-Type':'application/json',cookie:await cookie()};if(o)headers.Origin=o;
  assert.equal((await handle(new Request(origin+'/api/content',{method:'PUT',headers,body:'{}'}))).status,403);
 }
});
test('publishing always writes the fixed portfolio path and main branch',async()=>{
 const oldFetch=global.fetch;let call;
 global.fetch=async(url,options)=>{call={url,options};return Response.json({commit:{sha:'published-test-sha'}});};
 try{
  const content=Buffer.from('<!doctype html><script id="portfolio-data" type="application/json">{}</script>').toString('base64');
  const res=await handle(new Request(origin+'/api/content',{method:'PUT',headers:{Origin:origin,'Content-Type':'application/json',cookie:await cookie()},body:JSON.stringify({content,sha:'a'.repeat(40),branch:'different',path:'other-repo'})}));
  assert.equal(res.status,200);assert.equal(call.url,'https://api.github.com/repos/ykimran/ykimran.github.io/contents/index.html');assert.equal(JSON.parse(call.options.body).branch,'main');assert.equal(call.options.headers.Authorization,'Bearer test-github-token');
 }finally{global.fetch=oldFetch;}
});
test('missing OAuth credentials fails closed and shows setup page',async()=>{
 const secret=process.env.AUTH_GITHUB_SECRET;delete process.env.AUTH_GITHUB_SECRET;
 try{assert.equal((await handle(new Request(origin+'/api/content'))).status,503);assert.match(await(await handle(new Request(origin+'/'))).text(),/sign-in is not active yet/);}finally{process.env.AUTH_GITHUB_SECRET=secret;}
});
test('GitHub sign-in starts with CSRF, state, and PKCE protection',async()=>{
 const csrf=await handle(new Request(origin+'/api/auth/csrf'));
 assert.equal(csrf.status,200);
 const {csrfToken}=await csrf.json();assert.equal(typeof csrfToken,'string');
 const cookies=csrf.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 const response=await handle(new Request(origin+'/api/auth/signin/github',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',Cookie:cookies},body:new URLSearchParams({csrfToken,callbackUrl:origin+'/admin'})}));
 assert.equal(response.status,302);
 const target=new URL(response.headers.get('location'));assert.equal(target.origin,'https://github.com');assert.equal(target.pathname,'/login/oauth/authorize');assert.equal(target.searchParams.get('client_id'),'test-client');assert.ok(target.searchParams.get('state'));assert.ok(target.searchParams.get('code_challenge'));assert.equal(target.searchParams.get('code_challenge_method'),'S256');assert.equal(target.searchParams.get('redirect_uri'),origin+'/api/auth/callback/github');
});
