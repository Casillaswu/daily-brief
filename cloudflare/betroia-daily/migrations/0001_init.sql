-- 每天一行：rows 是前端解析后的紧凑数组 JSON
-- [group, id, name, cost, promo, reg, pay, payAmt, ftd, ftdAmt] 或 ['O', agentName, regs]
CREATE TABLE IF NOT EXISTS days (
  date       TEXT PRIMARY KEY,           -- YYYY-MM-DD
  rows       TEXT NOT NULL,
  file_key   TEXT,                       -- R2 里对应的原始档 key
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
