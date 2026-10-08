# Betroia 渠道日報 · Cloudflare 版

原本是 Claude artifact（https://claude.ai/artifact/Uy5eoWVpSCcnDL6EiFTsxS），資料只存在瀏覽器 localStorage。
這版搬到 **Cloudflare Pages**，上傳的報表改存雲端，團隊登入後看到同一份資料。

| 東西 | 放哪 |
|---|---|
| 頁面 | `public/index.html`（Cloudflare Pages 靜態檔） |
| 解析後的每日渠道資料 | **R2** `betroia-daily-raw` 的 `days/YYYY-MM-DD.json`，一天一檔（同一天重傳 = 覆蓋） |
| 上傳的原始 CSV / xlsx | **R2** bucket `betroia-daily-raw`，`raw/<時間>_<檔名>` 永久存檔 |
| API | `functions/`（Pages Functions）：`GET/DELETE /api/days`、`DELETE /api/days/:date`、`POST /api/upload` |
| 登入 | 環境變數 `APP_PASSWORD`（團隊通行碼存本機 `~/.cloudflare/betroia-daily-team-code.txt`）；沒設密碼時 API 一律拒絕（503），不會意外公開 |

CSV 解析仍在瀏覽器做（跟原版邏輯一字不差），上傳時把「原始檔 + 解析結果」一起送到 `/api/upload`。

## 部署（照遊戲盈虧分析台的做法，不用 D1）

```bash
cd cloudflare/betroia-daily
bash deploy.sh --set-code   # 第一次：建 R2 bucket / Pages 專案（若沒有）、寫入通行碼、部署
bash deploy.sh              # 之後改頁面只要這行
```

Token 用 `~/.cloudflare/game-pnl.env`（權限：Pages + R2，沒有 D1——所以資料全放 R2）。

網址：`https://betroia-daily.pages.dev`

### 建議：再套一層 Cloudflare Access（免費 50 人內）

密碼是共用的；要做到「每個人用自己的 email 登入、可隨時踢人」，在 Zero Trust → Access → Applications → Add → Self-hosted，
domain 填 `betroia-daily.pages.dev`（以及 `*.betroia-daily.pages.dev` 擋預覽網址），policy 設允許的 email。
Access 跟 `APP_PASSWORD` 可以並存。

## 本機測試

```bash
cd cloudflare/betroia-daily
echo 'APP_PASSWORD=test123' > .dev.vars
npx wrangler@4 pages dev
# 開 http://localhost:8788 ，密碼 test123
```

本機模式的 R2 是模擬的（存在 `.wrangler/`），不碰雲端資料。
