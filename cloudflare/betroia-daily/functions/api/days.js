import { json } from '../_lib.js';

// GET /api/days → { days: { 'YYYY-MM-DD': rows[] } }
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT date, rows FROM days ORDER BY date').all();
  const days = {};
  for (const r of results) days[r.date] = JSON.parse(r.rows);
  return json({ days });
}

// DELETE /api/days → 清空全部（R2 里的原始档保留作存档）
export async function onRequestDelete({ env }) {
  await env.DB.prepare('DELETE FROM days').run();
  return json({ ok: true });
}
