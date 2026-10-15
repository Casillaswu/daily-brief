import { json } from '../_lib.js';

// 渠道 → 媒体对照（来自后台「渠道管理列表」导出），存 R2 meta/channel-media.json
// 合并在服务端做（带版本检查重试），避免两个人先后上传时互相覆盖；每次改写前把旧版存到 meta/history/
const KEY = 'meta/channel-media.json';
const MAX_BYTES = 1024 * 1024;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// GET /api/meta → { media: { channelId: { m: 媒体, a: 所属总代 } } }
export async function onRequestGet({ env }) {
  const obj = await env.RAW.get(KEY);
  return json({ media: obj ? await obj.json() : {} });
}

// PUT /api/meta  body: { media: { id: { m, a } } } —— 只送这次新增/更新的渠道，服务端合并
export async function onRequestPut({ request, env }) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BYTES) return json({ error: '对照表超过 1MB' }, 413);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return json({ error: '对照表超过 1MB' }, 413);
  let body;
  try { body = JSON.parse(new TextDecoder().decode(buf)); } catch { return json({ error: '不是合法 JSON' }, 400); }
  const media = body && body.media;
  if (!media || typeof media !== 'object' || Array.isArray(media)) return json({ error: 'media 格式错误' }, 400);
  const incoming = {};
  for (const id of Object.keys(media)) {
    const v = media[id];
    if (!/^\d{1,12}$/.test(id) || !v || typeof v !== 'object' || typeof v.m !== 'string' || !v.m.trim() || v.m.length > 40 ||
        (v.a != null && (typeof v.a !== 'string' || v.a.length > 120)))
      return json({ error: `渠道 ${String(id).slice(0, 20)}：格式错误` }, 400);
    incoming[id] = { m: v.m.trim(), a: typeof v.a === 'string' ? v.a : '' }; // 只保存允许的栏位
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const cur = await env.RAW.get(KEY);
    const base = cur ? await cur.json() : {};
    const merged = {};
    for (const k of Object.keys(base)) if (own(base, k)) merged[k] = base[k];
    for (const k of Object.keys(incoming)) merged[k] = incoming[k];
    if (cur) await env.RAW.put(`meta/history/${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(base), { httpMetadata: { contentType: 'application/json' } });
    // 已有对照表：带版本检查（期间被别人改过就重读重合并）；第一次建立时直接写入
    const put = await env.RAW.put(KEY, JSON.stringify(merged), {
      httpMetadata: { contentType: 'application/json' },
      ...(cur ? { onlyIf: { etagMatches: cur.etag } } : {}),
    });
    if (put) return json({ ok: true, count: Object.keys(merged).length, media: merged });
  }
  return json({ error: '对照表正在被其他人更新，请稍后再试' }, 409);
}
