# Weekly HTML 設計規格 — News Clipping Wireframe 版

> **從 W18（2026-05-03）起為 weekly-*.html canonical 設計。**
> 取代舊報紙樣式（VOL.01 / 三頁 article / promo / hero），舊版本封存為 `weekly-2026-05-03-newspaper.html` 僅供對照。
>
> 本檔來自 `/uploads/NEWS Wireframe.zip` 的設計交付包改寫。
> 詳見 `lessons-learned.md` 2026-05-03 條目「設計切換」。

---

## 1. Design Tokens（不可改）

```css
--ink:#1f1d1a; --ink-2:#4a4742; --ink-3:#8a857d;
--paper:#ffffff; --paper-2:#f7f5f1;
--rule:#d9d4cb; --rule-2:#ebe6dd;
--hi:#fff3a6;
--pos:#c9e4cf; --pos-ink:#2f6b3b;
--neu:#e1dfd9; --neu-ink:#5b574e;
--neg:#f1c9c5; --neg-ink:#8a3a33;
--cat-a:#d6e2ee;  /* 法規 */
--cat-b:#e8dcec;  /* 產品 */
--cat-c:#efe1c9;  /* 運營商 */
--cat-d:#d9e8d6;  /* 市場 */
--cat-e:#f1d9d5;  /* 體博 */
```

字體：Arial → "Helvetica Neue" → "PingFang SC" → "Microsoft YaHei" → "PingFang TC" → "Microsoft JhengHei" → sans-serif（簡體優先、繁體 fallback）。

**語言**：自 W18（2026-05-03）起，weekly 一律使用 **簡體中文**輸出。下週 W19 跑 weekly 時，產出文件直接寫簡體（不要先寫繁體再轉）。

技術名詞英文保留（ROI / +EV / sportsbook / GGR / handle 等照舊）；地名 / 公司名按國際慣用拼寫（DraftKings、bet365、Polymarket 不翻）。

---

## 2. 11 個 Section（固定結構，順序不可換）

| # | id | 標題（h2） | grid layout | 必備元素 |
|---|---|---|---|---|
| — | `highlights` | 本週 5 個值得注意的訊號 | `.lead` + `.signals-grid`(2x2) | 1 lead + 4 signal-card |
| 01 | `s1` | 法規動態 — 美 / 巴 / 菲 / 英四線同步加壓 | `.grid-3` | 8-9 cards (含 1 hilite) |
| 02 | `s2` | M&A 與資本動作 | `.grid-3` + `.stat-strip-top` | 6 cards + 4 統計格 |
| 03 | `s3` | 產品與技術發布 | `.grid-3` | 9 cards (含 1 hilite + 🆕 新訊號) |
| 04 | `s4` | 大運營商動向 | `.grid-3` | 9 cards (含 1 hilite) |
| 05 | `s5` | 亞洲市場 — 菲律賓 / Macau / 東南亞 | `.stat-strip-top` + `.grid-3` | 4 統計格 + 9 cards |
| 06 | `s6` | 拉美市場 — 巴西重點 | `.grid-3` + `.law-box` + `.grid-3` | 3 cards + 1 law box + 3 cards |
| 07 | `s7` | 北美市場 — 美國 / 加拿大 | `.grid-3` | 9 cards (含 1 hilite) |
| 08 | `s8` | 體育博彩專區 | `.grid-3` | 6 cards (含 2 hilite) |
| 09 | `s9` | X / Social Pulse — 5/1 週一 weekly snapshot | `.x-pulse` (2 col) | 2 cards (BR + NA, NA 翻黑底) |
| 10 | `s10` | 來源覆蓋與動作建議 | `.colophon` (2 col) | 來源 grid + 下週要看的事 |

**section-head 結構**（固定）：
```html
<div class="section-head">
  <span class="num">XX</span>          <!-- 編號 01-10 或 🔥 -->
  <h2>標題</h2>                          <!-- 中文主標 -->
  <span class="h2-en">English Subtitle</span>  <!-- 英文副標 -->
</div>
```

**nav-anchors（masthead 下方的 chip 列）固定 11 個 link**：
🔥 本週亮點 → §1 法規 → §2 M&A → §3 產品 → §4 運營商 → §5 亞洲 → §6 拉美 → §7 北美 → §8 體博 → §9 X Pulse → §10 動作建議

---

## 3. 元件規格

### 3.1 `.lead`（本週亮點 - Signal 01 頭條）

```html
<article class="lead">
  <div class="meta-row">
    <span class="pill hot rank">01 · 頭條</span>
    <span class="cat {a-e}">{法規/產品/運營商/市場/體博}</span>
    <span class="pill {pos/neu/neg}"><span class="dot">{＋/○/−}</span>{正面/中立/負面}</span>
  </div>
  <h3>{標題，可含 <span class="hi"> 黃底關鍵字 </span>}</h3>
  <p class="src-meta">{來源 1 · 來源 2 · 來源 3 · MM/DD}</p>
  <p>{綜合判斷型摘要，含 <u>綜合判斷</u> 段、+EV / -EV 標記}</p>
  <a class="cta" href="...">閱讀原文 →</a>
</article>
```

### 3.2 `.signal-card`（Signal 02-05，灰底左 3px 黑邊）

```html
<div class="signal-card">
  <div class="label">{Signal 02 · UK COLLAPSE}</div>      <!-- 0.2em letter-spacing 大寫 -->
  <h4>{訊號標題}</h4>
  <p>{1 段內文，含 <span class="hi">關鍵字</span> + <u>綜合判斷</u> + 行動建議}</p>
</div>
```

### 3.3 `.card`（§1-§8 主要內容 col-card）

```html
<div class="card">                                          <!-- 加 .hilite = 灰底左黑邊 -->
  <div class="meta-row">
    <span class="cat {a-e}">{label}</span>
    <span class="pill {pos/neu/neg}"><span class="dot">{＋/○/−}</span>{label}</span>
    <!-- 可選：<span class="pill hot">{🆕 新 / 5/4 倒數 / Editor's Pick}</span> -->
  </div>
  <div class="byline">{Byline · UPPERCASE LETTER-SPACING}</div>
  <h4>{14px bold 標題，含黃底關鍵字}</h4>
  <p class="src">{來源 · MM/DD}</p>
  <p>{12.5px 內文 + <u>綜合判斷</u> + +EV/-EV}</p>
  <a class="cta" href="...">閱讀原文 →</a>
</div>
```

可內嵌：
- `<div class="pullquote">{斜體引用，左黑邊}</div>` ← 用於精華判斷
- `<div class="stat-strip">{4 個 .stat 統計格}</div>` ← 用於數據濃縮

### 3.4 `.law-box`（§6 巴西 RS Lei 等法律全文，紅左邊）

當有「需逐字保留警語 / 完整條款列表」的法律文件時用。

```html
<div class="law-box">
  <div class="label">{State · Region · Lei nº XXX}</div>
  <h4>{簽署日期 + 適應期}</h4>
  <ol class="warning-list">{警語直譯不可改寫，斜體}</ol>
  <ul class="terms">{核心條款項目}</ul>
  <a class="cta" href="...">閱讀原文 →</a>
</div>
```

### 3.5 `.x-pulse`（§9 X Pulse 兩欄）

- **8.1 BRAZIL**：一般 `.card`（米白底）
- **8.2 NORTH AMERICA**：`.card.hilite-na`（黑底白字）= 「最有價值 finding」翻轉視覺
- **⚠️ `.hilite-na` 黑底卡的 h4 禁用 `.hi` 黃底標**（黃底+白字看不清，W29 Reagan 抓）——黑底卡標題用純白粗體
- **行寬自查**：X Pulse 條目行、next-list 行寫完要在桌面寬度下單行放得下，溢出就砍字（Reagan 會用「減 N 字元」標注溢出量）

### 3.6 `.colophon`（§10 動作建議）

兩欄：左 = 覆蓋情況 + source-grid；右 = 下週要看的事 next-list（5/4 標 .urgent 紅）。

---

## 4. 內容映射規則（每週由 `weekly-*.md` 產 `weekly-*.html`）

### 4.1 5 個訊號 → 本週亮點

- **訊號 01** 永遠是「本週最重要 / 時效最緊迫」→ 進 `.lead`（文字 ~250-300 字 + 完整 <u>綜合判斷</u>）
- **訊號 02-05** → 4 張 `.signal-card`，2x2 grid（每張 ~120-150 字精華）
- 每個訊號的 cat / sentiment / 黃底關鍵字（3-5 個）必須對應 weekly-*.md 中的 5 大訊號

### 4.2 §1-§8 各 section → grid-3 col-cards

- 每張 card 對應 weekly-*.md 中一條新聞（一個 `[來源]` 段）
- card 數量目標：每 section 6-9 張，最後一張可選 `.hilite` 作為「Editor's Pick / 結構觀察」收尾
- §3 第一張 card 永遠放 🆕 新訊號（PAGCOR EGLD / B2B 白名單變動 / 供應商首發類）
- §6 巴西如果有州級法律全文，用 `.law-box` 隔出來放在 grid-3 中間

### 4.3 §9 X Pulse → 兩欄

- BR：`.card`（米白底）+ 上週 X Pulse 結果（從前一份 weekly 或 daily 帶過來）
- NA：`.card.hilite-na`（黑底白字）放最關鍵 finding；如果 NA 抓 0 條則整節刪除（不要硬擠）

### 4.4 §10 動作建議

- 來源 grid 列 Tier 1 + Tier 2（≥10 站）
- 下週要看的事列 5-7 件具體事件，**最迫切的（如法律生效日 / 重要財報）標 🔴 + .urgent class**

---

## 5. 替換規則（每週跑 weekly 時必走）

**取代 SKILL.md step 4 的舊「逐 section 替換」指令。**

```bash
# 0) 複製最新一份 weekly-*.html 為基底
cd /sessions/.../mnt/daily-brief
cp $(ls -t weekly-*.html | grep -v newspaper | head -1) weekly-YYYY-MM-DD.html

# 1) 全域替換（用 Edit tool 或 sed）
- <title>           → 「博彩產業週深度 Brief · W週數 · YYYY-MM-DD ~ YYYY-MM-DD」
- <meta description> → 5 大訊號 1 句精華
- masthead .kicker  → 「Weekly Gambling Brief · W週數 · YYYY-MM-DD ~ YYYY-MM-DD」
- masthead .row h1  → 「博彩產業週深度 · Reagan」
- masthead .meta-stats → 「{N} 個訊號 + 9 sections · {N} 媒體」
- footer-bottom 編輯日期 → 「2026-MM-DD ~ 2026-MM-DD」

# 2) 逐 section 替換（依映射規則）
- 本週亮點 highlights：
  · .lead   → 訊號 01 完整（標題 / src / 內文 / 連結）
  · 4 個 .signal-card → 訊號 02-05
- §1-§8：每張 .card 對應 weekly-*.md 中一條新聞，保持 6-9 張
- §9 X Pulse：BR + NA 兩欄，如無資料則整 section 刪除
- §10 動作建議：source-grid + next-list，最迫切標 🔴

# 3) 不要動的東西
- <style> 整段（tokens / responsive / cards 排版）
- nav-anchors 11 個 link 結構
- 11 個 section 的 id（highlights / s1-s10）
- section-head 結構（num + h2 + h2-en）
- 所有 class 名稱
```

---

## 6. 自我驗證 Checklist（產完強制跑）

```bash
cd /sessions/.../mnt/daily-brief
echo "===== 檔案存在 + 大小 ====="
ls -la weekly-YYYY-MM-DD.md weekly-YYYY-MM-DD.html
# md 預期 ~50-55KB / html 預期 ~85-95KB

echo "===== 「對 Reagan」字眼掃光 ====="
grep -n "對 Reagan" weekly-YYYY-MM-DD.md weekly-YYYY-MM-DD.html || echo "✓ 0 matches"

echo "===== <u>綜合判斷</u> 標籤 ====="
grep -c "<u>綜合判斷</u>" weekly-YYYY-MM-DD.md   # ≥ 20
grep -c "<u>綜合判斷</u>" weekly-YYYY-MM-DD.html # ≥ 25

echo "===== 11 個 section（包含 highlights + s1-s10）====="
grep -c 'id="highlights"\|id="s10"\|id="s1"\|id="s2"\|id="s3"\|id="s4"\|id="s5"\|id="s6"\|id="s7"\|id="s8"\|id="s9"' weekly-YYYY-MM-DD.html
# 預期 = 11

echo "===== nav-anchors 11 個 link ====="
grep -c 'href="#s\|href="#highlights"' weekly-YYYY-MM-DD.html  # 預期 = 11

echo "===== Daily News 殘留 / 舊樣式殘留 ====="
grep -n "Daily News\|Daily<span\|VOL\\.0\|class=\"promos\"\|class=\"lede\"\|class=\"hero\"" weekly-YYYY-MM-DD.html || echo "✓ 0 matches"

echo "===== 圖片佔位殘留 ====="
grep -n 'class="ph"\|imageUrl\|<img\|placeholder' weekly-YYYY-MM-DD.html || echo "✓ 0 image"

echo "===== 黃底 highlight ====="
grep -c 'class="hi\|background:#fff3a6\|background:var(--hi)' weekly-YYYY-MM-DD.html  # 預期 ≥ 10

echo "===== sentiment pills 全到 ====="
grep -c 'pill pos\|pill neu\|pill neg' weekly-YYYY-MM-DD.html  # 預期 ≥ 30

echo "===== <article class=\"lead\"> 開關配對 ====="
grep -c "<article class=\"lead\"" weekly-YYYY-MM-DD.html  # 預期 = 1
```

**驗證項目**：
- ✓ 兩個檔案存在
- ✓ 「對 Reagan」字眼 0 處殘留
- ✓ `<u>綜合判斷</u>` md ≥ 20 / html ≥ 25
- ✓ 11 個 section id 各 1 處（highlights + s1-s10）
- ✓ 11 個 nav-anchor link
- ✓ Daily News / VOL / promos / lede / hero 等舊樣式 class 殘留 = 0
- ✓ 圖片相關 0 處殘留（沒料就跳過、不放佔位）
- ✓ 黃底 highlight ≥ 10 處
- ✓ sentiment pills（pos/neu/neg）≥ 30 處
- ✓ §9 若有 X Pulse 資料則嵌入；無資料則整節已被刪除

如有不通過，回頭修，不要交「半成品」。

---

## 7. 寫作風格規則（2026-05-03 補）

> **問題根因**：W18 第一版讀起來「AI 感太重」——句子像英文 brief 直翻、英文縮寫沒解釋、抽象動詞太多。Reagan 反映「整段話看不太懂」。下次起遵守以下規則。

### 7.1 英文名詞首次出現必加中文說明

❌ 「DKNG 將於 Alberta 上線（搭配 World Cup）」
✅ 「DraftKings（DKNG，美國體博龍頭之一）會在加拿大 Alberta 省上線新平台，時間配合 World Cup（世界盃）流量。」

**首次出現必補中文的常見詞**（後續可只用英文 / 縮寫）：
- DKNG → DraftKings（美國體博龍頭之一）
- PMs → prediction markets（預測市場）
- GGR → 毛博彩收入（總投注額減去玩家贏走的）
- hold rate → 莊家保留率（玩家輸的比例）
- handle → 投注總額
- EBITDA → 營運盈利指標
- PAGCOR → 菲律賓博彩監管局
- SPA → 巴西財政部博彩監管秘書處
- CMN → 巴西全國貨幣委員會
- Anatel → 巴西國家電信局
- MGF → 最低保證授權金（每月每張照固定要繳）
- KYC → 客戶身份驗證
- RGD → 遠端博彩稅（UK 線上博彩稅）
- iGB / LSR / GI / IAG → iGaming Business / Legal Sports Report / Gambling Insider / Inside Asian Gaming（後三個都是博彩產業媒體）

### 7.2 抽象動詞 / 翻譯感詞 → 改具體動作

❌ 「過去 7 天訊號全面收斂為『這個月就要見真章』」
✅ 「過去一週的新聞都指向同一件事——5/4 開始這條法規真的要執行了。」

❌ 「白名單實際變動」
✅ 「核准名單第一次有新名字進去」

❌ 「雙殺期」
✅ 「兩個壓力同時來」

❌ 「持續主軸 ≥ 2 週」
✅ 「連著兩週以上都是同一個議題」

❌ 「外溢效應」
✅ 「會延伸影響到」

❌ 「IP-driven slot 經由獨家通路上市」
✅ 「用熱門 IP 改的老虎機 + 跟單一運營商獨家上架」

### 7.3 長句切短

❌ 一氣呵成的複雜從句（10 個逗號分隔）
✅ 句號斷開、每句一個主謂、用「重點：」「白話講：」做語氣轉折

### 7.4 「先講人話、再標技術詞」

❌ 「禁無實體經濟支撐衍生品交易堵死 PMs 偽裝衍生品路徑」
✅ 「重點：禁掉『沒有實體經濟支撐』的衍生品交易——白話講，就是堵死 Polymarket、Kalshi 這類預測市場平台『偽裝成衍生品』的灰色玩法。」

### 7.5 保留的英文 / 業界術語（這些不翻譯，保持英文）

- **行銷指標**：ROI / ROAS / CTR / CPA / LTV / +EV / -EV
- **博彩專業**：sportsbook / iGaming / casino / slot / live casino / SGP / in-play
- **品牌名 / 公司名**：FanDuel / DraftKings / Polymarket / Kalshi / bet365 / Betano（不要硬翻成「奔達樂」這種音譯）
- **法規 / 機構代號**：CMN / SPA / PAGCOR / Anatel / CFTC / DICJ（首次解釋過後直接用代號）
- **時間 / 地點**：保留 5/4 / Miami GP / Q1 / W18 等

### 7.6 寫作前自問三題

每個 card / signal 寫完前自問：
1. 「我把這段念給一個剛入行的同事聽，他聽完能複述嗎？」— 不能就 rewrite
2. 「裡面英文縮寫第一次出現有解釋嗎？」— 沒有就補
3. 「動詞是具體動作還是抽象比喻？」— 抽象就改具體

### 7.7 黑名單詞彙（一律不用）

下面這些是 W18 出包的高頻翻譯感 / AI 感詞——**下週 W19 開始一律不用**：

| 黑名單 | 改用 |
|---|---|
| 訊號全面收斂為 / 訊號收斂 | 新聞都指向 / 過去一週都在講同一件事 |
| 見真章 | 實際上路 / 真的要開始執行 |
| 持續主軸 ≥ N 週 | 連 N 週都在講 |
| 雙殺期 | 兩個壓力同時來 |
| 外溢效應 | 會延伸到 / 會影響到 |
| 戰場升級 | 戰局擴大 / 多開一條戰線 |
| 白名單實際變動 | 核准名單第一次有新名字進去 |
| 結構性議題 | 結構問題 |
| 底層邏輯 | 核心想法 / 根本原因 |
| 戰略意涵 | 策略意義 / 對 X 來說代表什麼 |
| 賦能 | 給...能力 |
| 佈局 | 規劃 / 布建 / 鋪 |
| 對齊 | 跟著 / 比照 |
| 傾斜 | 往...偏 |
| 進場 | 上線 / 拿照 / 簽約 / 開始營運（看情境） |
| 敘事（單獨用） | 說法 / 論述 / 故事 |
| 綁定（單獨用） | 合作 / 掛鉤 / 綁在一起 |
| 心理轉折點 | 業界開始改觀 |
| 主軸 | 重點 / 主題 |
| 「⋯之 N 倍」（生硬） | 「比 ⋯ 多 N 倍」 |
| 「N 個訊號」 | 「N 件值得注意的事」 |
| 死線 / 死线 | 期限 |
| 強制下線 / 强制下线 | 強制下架 |
| 低摩擦 / 高摩擦 | 下注省事 / 關卡多（要用就先解釋） |
| 量化了 | 變成了具體數字 |
| 「XX 主題：」EP 標題前綴 | 完整句標題、讀標題就懂結論 |

### 7.8 數字 / 金額落地

英文 brief 直接用 $175M / £549M / MOP$85.8B 是給投資人看的習慣。中文母語讀者會懵——**第一次出現時加台幣換算或量級換算**：

- $175M（約 56 億台幣）
- £549M（約 220 億台幣 / 將近 1/3 個台積電季營收量級）
- MOP$85.8B（約 3,400 億台幣）

第二次以後可以只用原幣不換算。

### 7.9 「+EV / -EV」前必有「對誰」

❌ 「+EV，最高優先序」
✅ 「對純線上品牌 +EV、對 UK 老牌 -EV」

加上對誰之後 EV 標記才有意義。

### 7.10 不要用「斜線 / 」當分隔符

英文 brief 為了精簡常用 `X / Y / Z` 串多個 item——但中文母語讀者看到這個會卡。一律改用：
- **頓號（、）**：列舉同類項目
- **完整句**：用「像是...、...、或...都不行」「包括...、...、跟...」

❌ `動畫 / 吉祥物 / 虛構角色 / AI 視覺`
✅ `動畫、吉祥物、虛構角色，或 AI 生成的視覺都不行`

❌ `平台 + 代理 + 媒體 + ISP 共擔`
✅ `平台、代理商、媒體、ISP 全部要一起扛`

❌ `TV / 串流 / VoD / 廣播只能 21:00–06:00 播`
✅ `電視、串流、隨選視訊、廣播只能在晚上 9 點到隔天早上 6 點之間播`

**例外**：來源欄、byline、tag 這類「資料標籤」場景仍可用 `·` 或 `/` 分隔（如 `iGB · LSR · 04/30`），因為這是視覺標籤、不是讀句。

### 7.11 名詞化 → 動詞句

英文 brief 喜歡把動作變成名詞（"announcement" 而非 "announce"）。中文母語讀者更習慣動詞句、有主詞。

❌ `警語面積 ≥ 15 %`（純名詞片語）
✅ `警語要佔螢幕至少 15 %`（有動詞「要佔」）

❌ `球衣贊助降級成「素標識」= 高曝光位失血`
✅ `球衣上只能掛簡單 logo、不能放完整品牌視覺——等於把高曝光的版位實質砍掉了`

❌ `整套素材鏈要重做`
✅ `整套素材鏈都得重做`

❌ `預算結構要從 X 往 Y 傾斜`
✅ `預算結構要從 X 改成往 Y 偏`

每個 bullet point 結尾自問：**這句有沒有動詞？沒有就改寫。**

### 7.12 段落斷句節奏

寫 12.5px 字內文時：
- 每句 30-50 字最舒服
- 連續 3 個逗號就要考慮換句號
- 一段超過 5 個分句 = 該拆成兩段
- 數字 / 金額 / 百分比要前後留空格（`+5.5%` → `+5.5 %`、`MOP$19.9B` 保持原狀）

### 7.13 讀者設定（2026-07-19 W29 補，Reagan 三輪意見後確立）

**報告讀者 = 博彩業內人士與客戶（對外 GitHub Pages 發布），不是編輯自己。**每張卡寫完自問三題：

1. 這句是在跟讀者說話、還是在跟自己（或上一版草稿）說話？——「先講背景」「先說清楚這句話的意思」這類 meta 句一律刪，直接講內容
2. 這張卡拿掉，讀者有損失嗎？——「維持上週觀察、無更新」的佔位卡直接刪，沒話說就不擺卡
3. 兩個數字並排，讀者會不會以為矛盾？——會就把口徑講清（如 250 億=世界盃合約 vs 500 億=平台全部盤口）

另外：EP 卡把多個市場硬併成一句結論（「菲律賓靠期限、澳門靠演唱會」）讀起來很怪——不同市場沒有共同因果就分開講或只講一個。標題必須自含結論、帶上國家前綴（「聯邦警語」→「巴西聯邦警語」）。

### 7.14 語氣：像人寫的、不像 AI（2026-08-02 W31 補，Reagan 手改示範後確立）

**問題**：`de_ai_lint` 通過不代表不像 AI——腳本只查形式層，翻譯腔（過場句、機械的 EV 開頭）它放行。Reagan 手改讯号 01 一段示範了要的語氣，提煉成以下硬規則：

1. **地名首次出現加中文注**：`Wisconsin（威斯康辛州）`、`Ohio（俄亥俄州）`。指政府別只寫「州」、寫「州政府」（是 government、不是地理區）——「CFTC 輸了 Wisconsin」→「CFTC 輸了 Wisconsin 州政府」。
2. **砍過場句**：「這週有了兩個實打實的答案」「先交代背景」「真正要盯的是」「把 X 跟 Y 連起來看」「重點是」——全刪，直接講內容。（這些也已加進 `de_ai_lint` 黑名單候選、逐步補。）
3. **「理由：」冒號直切**，句子壓短。次要細節能砍就砍（法院分歧那種 → 一句「仍有上訴空間」帶過，別展開第三巡迴 vs 第 X 巡迴）。
4. **不寫「第一個 / 第二個」脚手架**，直接流；多重對象用「對 X⋯。對 Y⋯」串同段。
5. **指公司用「商家 / 運營商」，別用「玩家」**（玩家 = 下注的人）。
6. 寫完自審：這句是跟讀者說話、還是跟上一版草稿說話？念給沒看過這份報告的老闆聽，他懂嗎？

### 7.15 去重：每個事件只給一張完整卡（2026-08-02 W31 補，取代舊「持續追蹤」機制）

**問題**：舊做法把 5 大訊號 + §1-§8 同一件事講 2-3 遍（signal 是 TL;DR、section 展開），老闆讀起來是同一個故事重複；而且「持續追蹤卡 + 判斷維持 WXX」= 假設讀者記得上週、看不懂。

**新規則（Reagan W31 拍板，以此為準）**：
- **每個具體事件只給一張完整卡**。5 大訊號就是前五件的完整卡；**§ 區不複述訊號**，只放訊號裡沒有的新事件 + 加值觀察（編輯觀察卡）。§ 區要引訊號用一句 `（見訊號 0X）` 帶過、不重寫判斷。
- **每張卡自成一體**：禁止「判斷維持 WXX」「上週悬念揭晓」「WXX 已講透」「續集」出現在讀者看得到的正文。要標歷史脈絡，寫在 byline（如「W30 已報」），不寫進判斷段。
- **只為跨週去重而存在的空卡直接砍**（沒新進展的持續追蹤），不佔位。
- 每張卡寫完自問：這件事前面（訊號區 or 別的 section）講過了嗎？講過就別再開一張完整卡，改成一句交叉引用或直接砍。

> **卡數紅線鬆綁**：舊「≥20 張」作廢——去重砍出來的 lean 版（W31 = 13 col-card + 5 訊號）是對的、不是沒料。改「夠就好、去重優先」，只要 judge/pills/hilite/cta 的 per-card 比例達標即可。（SKILL.md 本體在 app-internal 路徑、本次未改成；此檔 §7.14/§7.15 + lessons-learned 為真值源，SOP 衝突時聽這裡。）

---

## 8. 原文來源（cta）規則（2026-05-03 補）

> **每個區塊都必須有原文來源連結**。Reagan 反映「為什麼有些區塊是沒有原文來源的」。

### 8.1 一般 .card / .signal-card

必須有 `<a class="cta">閱讀原文 →</a>`，連到主要 source 的 article URL（不是站根頁）。

### 8.2 Hilite / Editor's Pick / 結構觀察 / Theme card

這類是聚合判斷沒有單一來源——但仍必須**標明**：

```html
<p class="src" style="font-style:italic;">
  📍 編輯整合自本期 §1 / §3 / §7 多源 — 無單一原文連結
</p>
```

或挑代表性最強的一條 source 加 cta，其他補一句「（其他證據見 §X / §Y）」。

### 8.3 自我驗證

```bash
# audit：每個 .card / .signal-card / .lead 都至少有 1 個 cta 或 src
grep -c "class=\"cta\"" weekly-YYYY-MM-DD.html
# 預期 ≥ .card 總數（一般情況下）
```

---

## 9. 何時退回舊報紙樣式

不要退回。舊樣式僅作對照保留。如需從歷史對照舊版內容深度，看 `weekly-2026-05-03-newspaper.html`。

如果未來要再做大改動，**先在 `lessons-learned.md` 開條目記錄決策理由 + 影響範圍**，再動 `_design-notes.md`。

---

**最後更新**：2026-05-03（建檔）

### 7.16 母语化 v2：de_ai_lint 通过 ≠ 母语感（2026-08-09 W32 补，Reagan 示范后确立）

**问题**：de_ai_lint 只查形式层黑名单，但「网络腔 + 翻译腔混合」它放行。Reagan 手改讯号 01 示范：
- 原「美国 Q2 财报周**实锤**：预测市场正在**吃掉**体育博彩的投注量，Flutter **转亏**、DraftKings 利润腰斩」
- 改「美国 Q2 财报周**说明**：预测市场正在**侵蚀**体育博彩的投注量，**造成** Flutter **转盈为亏**、DraftKings 利润腰斩」

提炼三条硬规则（写完自审，脚本查不了）：
1. **网络腔/夸张词 → 精准书面动词**：实锤→说明/印证/坐实、吃掉/咬/咬疼→侵蚀/蚕食/抢走、转亏→转盈为亏、摆明→公开表态、砸钱→大手笔投入/投入加大、端掉→破获、挨罚→受罚、硬碰→正面交锋、拐点→转折点、口水战→口头争论、活好→稳健经营、别被…吓到→不必过度悲观、别只丢…吓人→不要只抛出…制造焦虑、洗掉一半→扭转一半、收着→留存备用、敲大厂门→争取与大厂合作。
2. **并列堆砌之间补因果连接词**：「A 转亏、B 腰斩」→「造成 A 转盈为亏、B 利润腰斩」；多用「造成/使得/因而/从而/进而/由…转向」。
3. **语意层去重（不只标题）**：同一条主线（如预测市场）在多个 § 反复时，判断段的套话（「纯线上 -EV / 当竞争对手研究 / 监管未定」）到处重复即为语意重复。每张卡只留它**独有的那一层洞见**：§1 编辑观察讲「法庭 vs 行政两条线」、§4 讲「收入结构抗跌」、§7 讲「补充品 vs 替代品的品类定位」、§8 讲「赌博 vs 交易的定义权」——角度各不相同，判断不重复。

EN 对应：confirms 不用 nails/hard-proof；erode/siphon 不用 eat；swing to a loss 不用 turn loss。

### 7.17 卡片写给读者、不写作业流程 + 减字省行（2026-08-09 W32 补，Reagan 反馈）

**问题**：§5 PH promo 卡写成「菲律宾竞品 promo **抽查**」「Chrome **渲染后提取数字**」「其余几家遇到**登入墙、未取到数字**」——把内部作业方法（谁抓、用什么工具、哪些没抓到）暴露给读者，读起来像内部小朋友交作业，不是给客户的正式情报。

规则：
1. **卡片是给读者的结论，不是作业记录**。禁止出现「抽查/我抓/渲染/提取数字/登入墙/未取到/本期快照」这类流程词——凡是「我怎么得到这条」的描述一律删，只留「这条是什么、代表什么」。（与 §7.15「内部 ops 不写前端」同源，此处点名 promo / X Pulse / 抓取类卡。）
2. **来源标注写读者能懂的出处**，不写工具名：`grok_x_search`→「X 平台高信号贴文」、`Chrome MCP 抽查`→「持牌运营商官网优惠页」、`grok 实抓`→「grok 检索」或直接去掉。§10 来源覆盖同理，不列工具名。
3. **减字省行（排版）**：标题若只多两三个字就折到下一行、末行只剩几个字，就砍掉冗词凑成单行——一行更干净。砍的是冗词不是信息（「博彩场：」「主力优惠」「推出新产品」「正面迎战 Kalshi」这类可删）。桌面 col-card 单行约容 22 个全角字（3 栏 368px）/ 36 个（2 栏 560px）；写完扫一遍末行 ≤ 4~5 字的标题、优先修。
   ⚠️ Chrome 扩充强制 https、开不了本地 file://，排程沙箱也无 headless 浏览器——无法真渲染量行数时，用「全角字≈14.5px、行宽=卡内宽/字宽」估算末行字数来判断（见本次 estimator 做法）。

### 7.18 字级真值表（2026-08-23 W34 实测，Reagan 拍板维持现状）

Reagan 问「头条、讯号 02、讯号 03 三块卡字体不一样是确认的吗」。上线上页面量了 computed style，结论是**确实不一样**，而且这是 W18 以来每一期都有的：

| 区块 | 内文字级 | 行高 | 标题 |
|---|---|---|---|
| 头条 `article.lead` 内文 `p` | **13px** | 22.75px | h3 17px |
| 讯号卡 `.signal-card` `.signal-key` / `.signal-judge` | **12px** | 20.4 / 21px | h4 14.5px |
| 一般卡 `.card` 内文 `p` / `.judge` | **12.5px** | 21.9 / 22.5px | h4 14.5px |

**已知倒置**：讯号卡（版面第二重要）的 12px 比下面一般卡的 12.5px 还小。这不是刻意设计，是 stylesheet 带下来的漂移。

**2026-08-23 决议：维持现状、不动 `<style>`**。理由是跟 W18 以来所有历史期数保持一致，比修掉一个 0.5px 的倒置更重要。**后续任何人再看到这个差异，不要「顺手修正」**——这是已经评估过并刻意保留的状态。若将来要改，先在 `lessons-learned.md` 开条目、经 Reagan 同意，并且同批回头改所有已发布期数，不能只改新的一期。

**量测方法**（避免再量错元素）：`.lead` 与 `.card` 底下的第一个 `<p>` 是 `.src-meta` / `.src`（都是 11px 的来源行），不是内文。要量内文必须取「没有 class 的那个 `<p>`」：

```js
function bodyP(root){ return Array.from(root.querySelectorAll(':scope > p')).filter(p=>!p.className)[0]; }
```

我第一次就是直接 `querySelector('.lead p')` 抓到 src-meta、得到 11px 的错误结论，被实测推翻。

### 7.19 量孤行必须在真页面上量，别拿别期当量测台（2026-08-23 W34 实测）

W34 上线后在真页面复量，又抓到两个孤行标题——都是「拿 W33 当量测台」漏掉的。根因是 **`.grid-auto` 的栏宽会随该 section 的卡数变**：

| section 卡数 | 栏数 | `h4` 可用宽 |
|---|---|---|
| ≥ 3 张 | 3 栏 | **330px** |
| 2 张 | 2 栏 | **522px** |
| `.signal-card`（2×2 grid） | — | **522px** |

我拿 W33 的第一张 `.card h4`（330px）当量测容器，等于假设全页每张卡都是 330px。W34 的 §8 只有 2 张卡、实际是 522px，EN 版那张 Editor's Pick 在 522px 下变成 2 行只填 15%；W33 EN 的 Pixbet 讯号卡同理（21%）。

**规则**：
1. **发布后一定要回到线上真页面再扫一次**，这是唯一会用到正确栏宽的时机。`prepare-for-github.sh` 推完、Pages build 好（约 1–2 分钟）就跑。
2. 发布前的预检若一定要用别期当量测台，**必须按目标 section 的卡数挑对应宽度的容器**——3 张以上的 section 找一个 330px 的卡，2 张的 section 找 522px 的卡或直接用 `.signal-card h4`。
3. 只翻译、没量的标题最容易出事。W33 EN 那批「跟 CN 修剪对齐」的标题我只翻没量，Pixbet 那条就漏了。**任何改动过的标题都要量，翻译也算改动。**

线上复量指令（贴进 Chrome MCP 的 `javascript_tool`）：

```js
function m(el){var r=document.createRange();r.selectNodeContents(el);
  var rc=Array.from(r.getClientRects()).filter(x=>x.width>0.5);var rows=[];
  rc.forEach(function(x){var g=rows.find(y=>Math.abs(y.top-x.top)<4);
    if(g){g.left=Math.min(g.left,x.left);g.right=Math.max(g.right,x.right);}
    else rows.push({top:x.top,left:x.left,right:x.right});});
  var av=el.getBoundingClientRect().width,l=rows[rows.length-1];
  return {lines:rows.length,fill:Math.round((l.right-l.left)/av*100)};}
var bad=[];
document.querySelectorAll('.card h4, .signal-card h4').forEach(function(h){
  var r=m(h); if(r.lines>1&&r.fill<=30) bad.push(r.fill+'% | '+h.innerText.trim());});
JSON.stringify({byline:document.querySelectorAll('.byline').length,
  cards:document.querySelectorAll('.card').length, orphan:bad},null,1);
```

CN 与 EN 两个网址都要跑。若遇到 GitHub 回「Unicorn!」错误页，是 Pages 暂时性 5xx，重整即可。

---

### 7.19 标题模式：中文新闻导语句（2026-08-30 W35 补，Reagan 两轮退回后拍板）

**这是硬规则，所有 h3 / h4 标题一律照办，CN 与 EN 同步。**

**问题**：W35 第一版标题写成事实流水帐（「第九巡回法院判各州可以用赌博法管预测市场，与第三巡回相反，问题送上最高法院」），读完不知道结论。改写第二版又走过头、变成评论腔（「预测市场输掉关键一场：美国各州现在可以用赌博法把它们挡在门外」）。Reagan 指出两版都不是中文母语者读新闻时会用的总结方式，并给出正确示范。

**Reagan 示范句（以此为准）**：

> PAGCOR 今年收入预计比去年少 18%，是入金要多绕好几道手续，转换率下降。

**公式**：`主体（具体机构或公司名）+ 数字事实 + 原因或结果。`

四条硬性要求：

1. **主体写具体名称**，不写泛称。用「PAGCOR」不用「菲律宾监管机关」；用「Entain」不用「英国老牌集团」；用「第九巡回法院」不用「美国法院」。
2. **数字事实紧跟主体**，越早出现越好。「今年收入预计比去年少 18%」「交易约 39 亿美元」「180 天内作废全部联邦牌照」。
3. **原因或结果收尾**，用逗号接续，不另起分句结构。
4. **句号结尾**。标题是完整句子，不是短语。

四条禁令：

| 禁止 | 例子（W35 被退回的写法） | 改成 |
|---|---|---|
| 冒号副标 | `预测市场输掉关键一场：美国各州现在可以…` | 一句到底、用逗号接 |
| 「不是 A，是 B」对比 | `菲律宾今年少掉的生意不是玩家不玩了，是入金路径被剪断` | `PAGCOR 今年收入预计比去年少 18%，是入金要多绕好几道手续，转换率下降。` |
| 比喻 | `入金路径被剪断`、`大厂退出的市场对它太小` | 讲实际发生什么：`入金要多绕好几道手续` |
| 疑问句、感叹、省略号 | — | 一律陈述句 |

**EN 版同一套**：subject + figure + cause，句点结尾，不用冒号副标、不用 "not A but B"、不用比喻。
例：`PAGCOR expects income 18% below last year, because depositing now takes several extra steps and conversion has fallen.`

**长度**（沿用 §7.17 的全角当量：ASCII 字元算 0.5、中文算 1）：

- col-card h4 ≤ **44 当量**（约 2 行）
- signal-card h4 ≤ **72 当量**
- lead h3 ≤ **60 当量**

**机械检查**：`de_ai_lint.py` 已加三条（`标题冒号副标` / `标题对比句式` / `标题未以句号结尾`），产出后跑一次即挡得住。长度用 `scripts/check_headline_len.py`。

**W35 前后对照（存档给下次比对）**：

| 退回的写法 | 拍板的写法 |
|---|---|
| 预测市场输掉关键一场：美国各州现在可以用赌博法把它们挡在门外 | 第九巡回法院判 Kalshi 败诉，各州可用赌博法管预测市场，联邦牌照挡不住州执法。 |
| 菲律宾今年少掉的生意不是玩家不玩了，是入金路径被剪断 | PAGCOR 今年收入预计比去年少 18%，是入金要多绕好几道手续，转换率下降。 |
| 英国加税加了十个月，Entain 就从主要指数里掉出去了 | Entain 股价比一年高点低四成二，9 月 2 日将掉出 FTSE 100，主因是英国线上赌场税从 21% 加到 40%。 |
| 别再等菲律宾降费率了：监管机关自己欠了 370 亿披索 | 最高法院改判分成基准，PAGCOR 须补缴体育委员会 370 亿披索，分十年摊还。 |
| 大厂退出的市场，通常不是市场不好，是对它太小 | evoke、Kalshi、Entain 本周都在缩小版图，释出的份额流向区域型运营商。 |
| 这周三个国家都在修自己两年内刚订的规则 | 爱沙尼亚、英国、巴西的规则都在两年内被推翻，新市场的投入回收期要按两年估。 |

**docs/index.html 的 desc 同一套**：每个分句都是「主体 + 事实」、分号串接、句号结尾。
⚠️ `prepare-for-github.sh` **不会覆盖已存在的 index 条目**——同一周重跑脚本时 desc 不会更新，要手动改 `docs/index.html`。

### 7.20 同一篇原文不拆成多张卡（2026-08-30 W35 补）

W35 第一版有 9 张卡是从 4 篇原文拆出来的（同一个 cta URL 出现 2-3 次）。读者点过去会发现是同一篇，等于同一件事讲了三遍。

**规则**：一篇原文只出一张卡。真的有两个不同层面要讲，写进同一张卡的判断段，不要开第二张。
**自查**：产出后跑重复 URL 检查，命中即合并。

```bash
python3 - << 'PY'
import re
from collections import Counter
c=open('weekly-YYYY-MM-DD.html',encoding='utf-8').read()
u=re.findall(r'<a class="cta"[^>]*href="([^"]+)"',c)
d=[f'{n}x {x}' for x,n in Counter(u).items() if n>1]
print("重复 URL:", d or "✓ 0")
PY
```

**判断段也要去公式**：W35 第一版每张卡都收在「落到执行」（38 次）、「对持牌运营商 +EV」重复 5 次。EV 标记保留（硬规则），但每张要写具体对象；行动建议直接接在判断段后面，不加固定标签。

### 7.21 孤行量测：用浏览器实测、不要用字数估算（2026-08-30 W35 补）

**问题**：W35 用「全角当量」估算标题长度，CN 判定全过、EN 只抓到 9 个。实际用 Chrome 开线上页面量行盒，CN 有 8 个孤行、EN 有 **23 个三行标题 + 7 个孤行**。估算法在 EN 上完全失准，因为英文单字不换行、一个长单字就会把整行挤下去。

**孤行定义**：标题占 ≥2 行，且**末行宽度 < 38% 卡宽**（末行只剩两三个字或几个字元）。三行标题一律要修。

**唯一可靠做法**：weekly 发佈后（或改动后），用 Chrome MCP 开 GitHub Pages 线上页量测。排程沙箱没有 headless 浏览器、Chrome 扩充开不了本地 `file://`，所以**必须走线上页**。

改动还没上线时，用「注入法」在线上页量新标题：把新版 h3/h4 的 innerHTML 依序覆盖 DOM，再量。标题数与顺序 CN/EN 都是 33 个、一一对应。

```js
// 贴进 mcp__claude-in-chrome__javascript_tool（先 navigate 到线上页）
var T=[ /* 新标题的 innerHTML 阵列，含 <span class="hi"> */ ];
var els=document.querySelectorAll('h3,h4');
if(els.length!==T.length) return JSON.stringify({err:'count mismatch',dom:els.length});
els.forEach(function(el,i){el.innerHTML=T[i];});
function measure(el){
  var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false),n,rects=[];
  while(n=w.nextNode()){var r=document.createRange();r.selectNodeContents(n);
    Array.from(r.getClientRects()).forEach(function(x){if(x.width>0.5&&x.height>1)rects.push(x);});}
  if(!rects.length)return null;
  var lines={};rects.forEach(function(x){var k=Math.round(x.top/4)*4;lines[k]=(lines[k]||0)+x.width;});
  var keys=Object.keys(lines).map(Number).sort(function(a,b){return a-b;});
  return {n:keys.length,lastPct:Math.round(lines[keys[keys.length-1]]/el.getBoundingClientRect().width*100)};
}
var bad=[],three=0;
els.forEach(function(el){var m=measure(el);if(!m)return;if(m.n>=3)three++;
  var kind=el.closest('.signal-card')?'signal':(el.tagName==='H3'?'lead':'col');
  if(m.n>=2&&m.lastPct<38)bad.push({kind:kind,lines:m.n,lastPct:m.lastPct,txt:el.textContent.trim()});});
return JSON.stringify({total:els.length,threeLine:three,orphans:bad.length,list:bad});
```

⚠️ **必须用 text node 逐一取 rect**（`createTreeWalker` + `Range`），不能直接对 `<h4>` 建 Range —— `<span class="hi">` 会让 rect 重复计算，末行宽度会算出 139% 这种荒谬值。

**W35 实测的每行容量（1317px 视窗、桌面三栏）**：

| 位置 | 卡宽 | CN 一行 | EN 一行 |
|---|---|---|---|
| col-card | 330px | 约 21-22 全角字 | 约 70 字元 |
| signal-card | 522px | 约 33-34 全角字 | 约 110 字元 |
| lead h3 | 1087px | 约 40 全角字（单行） | 约 160 字元 |

**据此定标题目标长度**：
- CN col：**≤ 21 字**（单行）或 **30-40 字**（两行饱满）。**22-28 字最难看**，末行只剩几个字。
- EN col：**≤ 70 字元**（单行）或 **110-135 字元**（两行饱满）。**75-95 字元最难看**。
- 修法二选一：砍到单行，或加实质资讯把末行填到 38% 以上。**不要停在中间**。

**W35 实例**：EN「A Washington State court requires Kalshi to geofence state residents by 2 September.」83 字元、两行末行 15% → 砍成「Washington orders Kalshi to geofence its residents by 2 September.」66 字元、单行。

### 7.22 §0 触发讯号回顾的 HTML 落地（2026-09-06 W36 补，取代 SKILL.md 待补设计的选项 A / B）

W36 依 SKILL.md 选项 A 在 §10 前插了一个带 `num="00"` 的 TRIGGER REVIEW 区块，版面变成 09 → 00 → 10；且 7 条全是巴西，等于把同一市场切成两块（§6 四张 + 另一区七张），违反 §7.15。Reagan 指出后拍板改为下列做法，**此处为真值源，与 SKILL.md 选项 A / B 冲突时听这里**。

**md 与 HTML 分工**：

- **md 主档**永远保留完整 §0（原始档名 + 事件 + `<u>当时判断</u>`原文 + 一周后 follow-up）。这是稽核轨迹，用来回头评估 trigger monitor 判得准不准，不能散掉。
- **HTML 视觉版不另开 §0 区块**，trigger 卡按主题併进对应的市场 / 主题区块。

**併入规则**：

| 条数与分布 | 做法 |
|---|---|
| ≥3 条且集中在单一市场 | 全部併进该市场区块（W36：7 条全巴西 → §6，共 11 张卡） |
| 分散在多个市场 | 各自併进所属区块（§1 / §5 / §6 / §7⋯） |
| 0-2 条 | 只留 md，HTML 不落地 |

**併入后的卡片规格**：沿用 `.card`，`cat` 用所属区块的色码、`pill hot` 写 `Trigger N · 主题`，`src` 标 `trigger-YYYY-MM-DD.md · 媒体 · MM/DD`，**判断文字一字不改**，并保留两个 `.judge` 区块：

```html
<div class="judge"><br><span class="lead-in"><u>当时判断</u></span>：⋯</div>
<div class="judge"><br><span class="lead-in"><u>一周后 follow-up</u></span>：⋯</div>
```

EN 对应：`<u>Judgment at the time</u>` / `<u>One week on</u>`。

**不可动**：11 个 section id、nav 11 个锚点、区块顺序，全部维持不变——这套做法的好处就是不碰 canonical。

**单一区块变厚是可以的**：W36 §6 = 11 张卡、其他区块 3-5 张。那一週巴西真的出了十件事，比例失衡是诚实的。卡数照 §7.15「够就好、去重优先」，只看 per-card 比例达不达标。

**交叉引用**：md 在 §0、HTML 在同一区块，引用语一律中性——「（详见本期 Trigger 5 至 Trigger 7）」，不写「详见 §0」也不写「详见本节」。

**补完必须回头改结论**：trigger 併进来之后，检查既有卡的分类是否还成立。W36 §6 编辑观察原写「三条线（行政、司法、电信）」，补进 Trigger 5-7 后更正为「四条线（行政、发照、电信、消保）」，§10 也补了 Procon-PE 的期限。补内容不改结论等于只做一半。

### 7.23 每行容量实测修正 + 孤行改用换行模拟（2026-09-06 W36，取代 §7.21 的容量表）

**§7.21 的 EN 容量数字是错的，连带让 `check_headline_len.py` 形同虚设。**

W36 把 CN + EN 推上 GitHub Pages 后用 Chrome 实测（viewport 1163px、桌面三栏），结果：CN 0 个三行标题、6 个孤行；**EN 43 个标题有 39 个排成三行、16 个孤行**——而 `check_headline_len.py` 回报「✅ 全部合格」。

根因：§7.21 写「EN col 一行约 70 字元」，在 318px 卡宽、14.5px 字级下要每字元 4.7px，物理上不可能。旧版 `check_headline_len.py` 的 EN 上限 col=64 全角当量（= 128 字元 ≈ 3.5 行）就是照这个错误数字订的，等于放行所有东西。W35 那次也踩过（EN 23 个三行标题），但当时归因成「估算法在 EN 上失准」，没回头修门槛，所以 W36 原样再犯一次。

**实测容量（此表为新真值，§7.21 旧表作废）**：

| 区块 | 卡宽 | 字级 | CN 每行 | EN 每行 |
|---|---|---|---|---|
| `article.lead` h3 | 1050px | 17px | 61 全角字 | 125 字元 |
| `.signal-card` h4 | 504px | 14.5px | 34 全角字 | 51 字元 |
| `.card` h4（col） | 318px | 14.5px | 21 全角字 | 36 字元 |

**据此定的目标长度**（孤行门槛沿用 §7.21 的末行 ≥ 38%）：

| 区块 | CN 单行 | CN 两行饱满 | EN 单行 | EN 两行饱满 |
|---|---|---|---|---|
| lead | ≤ 61 字 | — | ≤ 125 字元 | — |
| signal | ≤ 34 字 | 47–68 字 | ≤ 51 字元 | 70–102 字元 |
| col | ≤ 21 字 | 29–42 字 | ≤ 36 字元 | 50–72 字元 |

lead 一律压成单行；signal 与 col 单行或两行饱满，**中间地带（CN col 22–28 字、EN col 37–49 字元）最难看，末行只剩几个字**。

**`check_headline_len.py` 已改版**（2026-09-06）：不再只比「最大当量」，改成用上表的每行容量做换行模拟，同时挡两件事——行数超过上限、以及末行填充率 < 38% 的孤行。每行容量写在脚本顶端的 `CAP_CN` / `CAP_EN`，跟本节同步。

**仍然要上线实测**：换行模拟按等宽估算，英文实际断在单字边界，可能差 ±1 行。§7.21 的「发布后用 Chrome MCP 开线上页量行盒」流程不取消——脚本负责写作当下挡掉明显超标，线上实测负责最后确认。W36 两轮实测数据留在 `snapshots/2026-W36/`。

**§7.23 补充（W36 第二轮实测）**：重写后线上复量，EN 三行标题 39 → **0**、孤行 16 → 8，CN 孤行 6 → 3。剩下的绝大多数落在末行 30–37%，只有一个是真孤行（末行 13%，已修）。

发现一件跟 CN 不一样的事：**EN col 的 38% 孤行门槛在实务上几乎达不到**。318px 卡宽一行只放约 36 个英文字元，55–70 字元的标题必然是两行、末行落在 30–37%；要冲到 38% 以上得写到 72 字元以上，但那又会挤成三行。窗口太窄。

所以 **EN col 的孤行下限放宽到 30%**（CN 维持 38%）。理由：末行填三分之一在 318px 上是完整一段字、不是「只剩两三个字元」的难看情况，§7.21 的 38% 是从 CJK 经验订的。为了凑 38% 去塞填充词，违反 §7.19「砍冗词、不塞废字」——宁可留 33%。

**优先级**：三行标题（一律要修）> 末行 < 30% 的真孤行（要修）> 末行 30–37%（EN col 可接受、CN 仍要修）。
