import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from '@auth/core/jwt';
import { handle, config } from '../api/handler.js';

const env = {
  APP_ORIGIN: 'https://dashboard.example.workers.dev',
  AUTH_SECRET: 'synthetic-worker-test-secret-1234567890123456789012',
  AUTH_GITHUB_ID: 'worker-test-client', AUTH_GITHUB_SECRET: 'worker-test-client-secret',
};
async function cookie() {
  const name = '__Secure-authjs.session-token';
  return `${name}=${await encode({ secret: env.AUTH_SECRET, salt: name, token: { githubId: '85554274', githubToken: 'worker-test-token' }, maxAge: 60 })}`;
}
test('worker uses its own bindings rather than another host environment', async () => {
  assert.equal(config(env).providers[0].options.clientId, env.AUTH_GITHUB_ID);
  const response = await handle(new Request(env.APP_ORIGIN + '/health'), { env });
  assert.deepEqual(await response.json(), { ok: true, configured: true });
  assert.equal((await handle(new Request(env.APP_ORIGIN + '/api/content'), { env })).status, 401);
});
test('worker serves the protected editor from bundled assets', async () => {
  const old = global.fetch;
  global.fetch = async () => Response.json({ sha: 'a'.repeat(40), content: Buffer.from('<html><body><script id="portfolio-data" type="application/json">{}</script></body></html>').toString('base64') });
  try {
    const response = await handle(new Request(env.APP_ORIGIN + '/admin', { headers: { cookie: await cookie() } }), {
      env, loadStudio: async () => ({ js: '/* bundled editor */', css: '/* bundled css */' }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /bundled editor/); assert.match(body, /bundled css/);
    assert(!body.includes('worker-test-token')); assert(!body.includes(env.AUTH_SECRET));
  } finally { global.fetch = old; }
});
test('worker rejects a stale write rather than overwriting the other dashboard', async () => {
  const old = global.fetch;
  global.fetch = async () => new Response('{}', { status: 409 });
  const content = Buffer.from('<script id="portfolio-data">{}</script>').toString('base64');
  try {
    await assert.rejects(handle(new Request(env.APP_ORIGIN + '/api/content', {
      method: 'PUT', headers: { cookie: await cookie(), Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: 'a'.repeat(40), content }),
    }), { env }), error => error.status === 409);
  } finally { global.fetch = old; }
});
test('unconfigured worker fails closed', async () => {
  assert.equal((await handle(new Request(env.APP_ORIGIN + '/api/content'), { env: {} })).status, 503);
});
