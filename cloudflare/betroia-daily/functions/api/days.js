import { json, DAY_PREFIX, listDayKeys } from '../_lib.js';

// GET /api/days → { days: { 'YYYY-MM-DD': rows[] } }
export async function onRequestGet({ env }) {
  const keys = (await listDayKeys(env.RAW)).sort();
  const objs = await Promise.all(keys.map(k => env.RAW.get(k)));
  const days = {};
  for (let i = 0; i < keys.length; i++) {
    if (!objs[i]) continue;
    days[keys[i].slice(DAY_PREFIX.length, -'.json'.length)] = await objs[i].json();
  }
  return json({ days });
}

// DELETE /api/days → 清空全部（raw/ 里的原始档保留作存档）
export async function onRequestDelete({ env }) {
  const keys = await listDayKeys(env.RAW);
  for (let i = 0; i < keys.length; i += 1000) await env.RAW.delete(keys.slice(i, i + 1000));
  return json({ ok: true });
}
