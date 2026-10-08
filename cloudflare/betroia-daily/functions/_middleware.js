import { json } from './_lib.js';

// /api/* 需要密码（环境变量 APP_PASSWORD）。没设密码时一律拒绝，避免数据意外公开。
// 建议再在外层套 Cloudflare Access（见 README）。
async function digest(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
async function safeEqual(a, b) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function onRequest({ request, env, next }) {
  if (!new URL(request.url).pathname.startsWith('/api/')) return next();
  if (!env.APP_PASSWORD) return json({ error: '服务端未设定 APP_PASSWORD' }, 503);
  const key = request.headers.get('X-App-Key') || '';
  if (!(await safeEqual(key, env.APP_PASSWORD))) return json({ error: '密码错误' }, 401);
  return next();
}
