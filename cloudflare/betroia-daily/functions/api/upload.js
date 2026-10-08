import { json, DATE_RE, dayKey } from '../_lib.js';

const MAX_FILE = 20 * 1024 * 1024;

// POST /api/upload（multipart）
//   file：原始 CSV / xlsx → 存到 R2
//   days：前端解析好的 { 'YYYY-MM-DD': rows[] } JSON → 写入 R2 days/（同一天覆盖）
export async function onRequestPost({ request, env }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: '请求格式错误' }, 400); }

  let days;
  try { days = JSON.parse(form.get('days') || ''); } catch { return json({ error: 'days 不是合法 JSON' }, 400); }
  const dates = Object.keys(days || {});
  if (!dates.length) return json({ error: '没有任何日期数据' }, 400);
  for (const d of dates) {
    if (!DATE_RE.test(d) || !Array.isArray(days[d]) || !days[d].every(Array.isArray))
      return json({ error: `${d}：数据格式错误` }, 400);
  }

  let fileKey = null;
  const file = form.get('file');
  if (file && typeof file === 'object') {
    if (file.size > MAX_FILE) return json({ error: '原始档超过 20MB' }, 413);
    const safeName = String(file.name || 'upload').replace(/[^\w.\-一-鿿]+/g, '_').slice(0, 120);
    fileKey = `raw/${new Date().toISOString().replace(/[:.]/g, '-')}_${safeName}`;
    await env.RAW.put(fileKey, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { dates: dates.sort().join(',') },
    });
  }

  await Promise.all(dates.map(d => env.RAW.put(dayKey(d), JSON.stringify(days[d]), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: fileKey ? { fileKey } : {},
  })));
  return json({ ok: true, dates, fileKey });
}
