import { json, DAY_PREFIX, listDayKeys, mapLimit } from '../_lib.js';

// GET /api/days → { days: { 'YYYY-MM-DD': rows[] } }
export async function onRequestGet({ env }) {
  const keys = (await listDayKeys(env.RAW)).sort();
  const rows = await mapLimit(keys, 4, async k => {
    const obj = await env.RAW.get(k);
    return obj ? obj.json() : null;
  });
  const days = {};
  keys.forEach((k, i) => { if (rows[i]) days[k.slice(DAY_PREFIX.length, -'.json'.length)] = rows[i]; });
  return json({ days });
}

// DELETE /api/days → 清空全部（raw/ 里的原始档保留作存档）
export async function onRequestDelete({ env }) {
  const keys = await listDayKeys(env.RAW);
  for (let i = 0; i < keys.length; i += 1000) await env.RAW.delete(keys.slice(i, i + 1000));
  return json({ ok: true });
}
