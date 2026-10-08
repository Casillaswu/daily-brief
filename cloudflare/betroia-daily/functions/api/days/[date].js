import { json, DATE_RE } from '../../_lib.js';

// DELETE /api/days/YYYY-MM-DD
export async function onRequestDelete({ env, params }) {
  if (!DATE_RE.test(params.date)) return json({ error: '日期格式错误' }, 400);
  await env.DB.prepare('DELETE FROM days WHERE date = ?').bind(params.date).run();
  return json({ ok: true });
}
