# Betroia 渠道日報 · Cloudflare 版

原本是 Claude artifact（https://claude.ai/artifact/Uy5eoWVpSCcnDL6EiFTsxS），資料只存在瀏覽器 localStorage。
這版搬到 **Cloudflare Pages**，上傳的報表改存雲端，團隊登入後看到同一份資料。

| 東西 | 放哪 |
|---|---|
| 頁面 | `public/index.html`（Cloudflare Pages 靜態檔） |
| 解析後的每日渠道資料 | **D1** 資料庫 `betroia-daily`，一天一列（同一天重傳 = 覆蓋） |
| 上傳的原始 CSV / xlsx | **R2** bucket `betroia-daily-raw`，`raw/<時間>_<檔名>` 永久存檔 |
| API | `functions/`（Pages Functions）：`GET/DELETE /api/days`、`DELETE /api/days/:date`、`POST /api/upload` |
| 登入 | 環境變數 `APP_PASSWORD`；沒設密碼時 API 一律拒絕（503），不會意外公開 |

CSV 解析仍在瀏覽器做（跟原版邏輯一字不差），上傳時把「原始檔 + 解析結果」一起送到 `/api/upload`。

## 一次性設定（Cloudflare 後台 + GitHub，約 10 分鐘）

1. **Cloudflare API Token**：dash.cloudflare.com → My Profile → API Tokens → Create Token → Custom，權限勾：
   - Account · Cloudflare Pages · Edit
   - Account · D1 · Edit
   - Account · Workers R2 Storage · Edit
2. **Account ID**：dash 任一頁右側欄 / 網址列 `dash.cloudflare.com/<account_id>`。
3. **D1**：Storage & Databases → D1 → Create → 名稱 `betroia-daily` → 複製 Database ID。
4. **R2**：R2 → （第一次要先啟用 R2，免費額度 10GB）→ Create bucket → 名稱 `betroia-daily-raw`。
5. **GitHub Secrets**：repo → Settings → Secrets and variables → Actions → New repository secret，加 4 個：

   | Secret | 值 |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | 第 1 步的 token |
   | `CLOUDFLARE_ACCOUNT_ID` | 第 2 步 |
   | `D1_DATABASE_ID` | 第 3 步 |
   | `APP_PASSWORD` | 團隊登入密碼（自己訂，夠長） |

6. GitHub → Actions → **Deploy Betroia 渠道日报 to Cloudflare Pages** → Run workflow。
   之後只要 `cloudflare/betroia-daily/` 有改動、推上 main 就自動重新部署。

網址：`https://betroia-daily.pages.dev`

### 建議：再套一層 Cloudflare Access（免費 50 人內）

密碼是共用的；要做到「每個人用自己的 email 登入、可隨時踢人」，在 Zero Trust → Access → Applications → Add → Self-hosted，
domain 填 `betroia-daily.pages.dev`（以及 `*.betroia-daily.pages.dev` 擋預覽網址），policy 設允許的 email。
Access 跟 `APP_PASSWORD` 可以並存。

## 本機測試

```bash
cd cloudflare/betroia-daily
echo 'APP_PASSWORD=test123' > .dev.vars
npx wrangler@4 d1 migrations apply betroia-daily --local
npx wrangler@4 pages dev
# 開 http://localhost:8788 ，密碼 test123
```

本機模式的 D1 / R2 是模擬的（存在 `.wrangler/`），不碰雲端資料。
