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
