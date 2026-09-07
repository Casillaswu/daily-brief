#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_headline_len.py — 标题长度与孤行预测（_design-notes.md §7.19 / §7.21）

2026-09-06（W36）改版：旧版只查「最大当量」，且 EN 上限 col=64 当量（=128 字元）
比实际容量宽了一倍，结果 W36 EN 43 个标题有 39 个排成三行却回报「全部合格」。
新版改用 Chrome 线上实测的每行容量做换行模拟，同时挡「太长」与「孤行」。

实测基准（GitHub Pages 线上页、viewport 1163px、桌面三栏）：
  区块         卡宽      字级      CN 每行     EN 每行
  lead h3      1050px    17px      61 全角字   125 字元
  signal h4     504px    14.5px    34 全角字    51 字元
  col h4        318px    14.5px    21 全角字    36 字元

全角当量：ASCII 0.5、中文 1。孤行定义（§7.21）：占 >=2 行且末行宽度 < 38%。

用法：python3 scripts/check_headline_len.py weekly-2026-09-06.html [more.html ...]
exit 0 = 全过；exit 1 = 有超标或孤行
"""
import math
import re
import sys
from pathlib import Path

# 每行容量（全角当量）。EN 由「字元数 x 0.5」换算而来。
CAP_CN = {'lead': 61, 'signal': 34, 'col': 21}
CAP_EN = {'lead': 62, 'signal': 25, 'col': 18}
MAX_LINES = {'lead': 1, 'signal': 2, 'col': 2}
MIN_LAST_FILL = 0.38  # 末行至少要填满这个比例，否则算孤行


def width(s: str) -> float:
    return sum(0.5 if ord(ch) < 128 else 1 for ch in s)


def txt(x: str) -> str:
    return re.sub(r'<[^>]+>', '', x).strip()


def target(kind: str, cap: float) -> str:
    """给出该区块的建议长度区间（当量）。"""
    lo2 = cap * (1 + MIN_LAST_FILL)
    if MAX_LINES[kind] == 1:
        return f"<= {cap:.0f}（单行）"
    return f"<= {cap:.0f}（单行）或 {lo2:.0f}-{cap * 2:.0f}（两行饱满）"


def check(path: Path) -> int:
    c = path.read_text(encoding='utf-8')
    is_en = path.name.endswith('-en.html')
    caps = CAP_EN if is_en else CAP_CN
    rows = []
    for x in re.findall(r'<h3>(.+?)</h3>', c, re.DOTALL):
        rows.append(('lead', txt(x)))
    for x in re.findall(r'<div class="signal-card">.*?<h4>(.+?)</h4>', c, re.DOTALL):
        rows.append(('signal', txt(x)))
    for x in re.findall(r'<div class="card[^"]*">.*?<h4>(.+?)</h4>', c, re.DOTALL):
        rows.append(('col', txt(x)))

    bad = []
    for kind, s in rows:
        cap = caps[kind]
        w = width(s)
        lines = max(1, math.ceil(w / cap))
        last_fill = (w - (lines - 1) * cap) / cap
        if lines > MAX_LINES[kind]:
            bad.append((kind, s, w, cap, f"{lines} 行（上限 {MAX_LINES[kind]} 行）"))
        elif lines >= 2 and last_fill < MIN_LAST_FILL:
            bad.append((kind, s, w, cap, f"孤行：末行仅 {last_fill * 100:.0f}%（需 >= 38%）"))

    lang = 'EN' if is_en else 'CN'
    print(f"\n{'=' * 60}\n📏 {path.name}（{lang}·每行容量 lead/signal/col = "
          f"{caps['lead']}/{caps['signal']}/{caps['col']} 当量）— 共 {len(rows)} 个标题\n{'=' * 60}")
    if not bad:
        print("  ✓ 全部单行或两行饱满、无孤行")
        return 0
    for kind, s, w, cap, why in bad:
        print(f"  ✗ [{kind}] {w:.1f} 当量 · {why}")
        print(f"      建议 {target(kind, cap)}")
        print(f"      {s}")
    return len(bad)


def main() -> None:
    if len(sys.argv) < 2:
        print("用法: python3 scripts/check_headline_len.py <file.html> [...]", file=sys.stderr)
        sys.exit(2)
    total = 0
    for a in sys.argv[1:]:
        p = Path(a)
        if not p.exists():
            print(f"⚠️  跳过（不存在）: {a}", file=sys.stderr)
            continue
        total += check(p)
    print(f"\n{'=' * 60}")
    if total:
        print(f"❌ 共 {total} 个标题超行数或有孤行——砍到单行，或补实质资讯把末行填到 38% 以上")
        sys.exit(1)
    print("✅ 标题长度与孤行全部合格")
    sys.exit(0)


if __name__ == '__main__':
    main()
