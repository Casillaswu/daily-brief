export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 解析后的每日数据：R2 里一天一个 JSON 档
export const DAY_PREFIX = 'days/';
export const dayKey = date => `${DAY_PREFIX}${date}.json`;

export async function listDayKeys(bucket) {
  const keys = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix: DAY_PREFIX, cursor });
    for (const o of page.objects) keys.push(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
}

// Workers 同时最多 6 条未关闭的连接（R2 get/put 都算）→ 并发压在 4，且每个任务内把 body 读完
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const worker = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
