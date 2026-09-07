# Lessons Learned — 排程踩坑紀錄 + 設計決策

> SKILL.md 的 SOP step 1 會自動讀這個檔。
> 每次踩坑、每次設計決策都加一條，避免下次重複犯錯。
>
> **規則**：條目用倒序（最新在最上面），每條附 ✅ 已修 / ⚠️ 仍在追 / 📐 設計決策 標記。

---

## 2026-08-16（W33）收尾指令三连坑：zsh 不认注解、git 双锁、失败不中止 ✅ 已修

**现象**：W33 产完、docs 都对，但把发布指令贴给 Reagan 之后连错三轮，最后一度**把旧版推上 GitHub**。

**坑 1 — zsh 互动模式不认 `#` 注解**
给的指令带了中文注解（`# 1) 清掉沙箱留下的 lock`），Reagan 一贴整段 `zsh: parse error near ')'`，**一行都没跑**（连 `cd` 都没生效，所以后面 `git log` 回 not a git repository）。
根因：zsh 的 `interactive_comments` 选项**预设关闭**，`#` 开头在互动 shell 不是注解、是指令；碰到 `)` 就 parse error 中止整段。bash 预设开启，所以平常写脚本没事、贴进 zsh 就炸。
→ **修法：给 Reagan 的终端机指令一律不带注解**。要解释就写在指令区块外面的正文。

**坑 2 — 沙箱留下的 git 锁档不只一个**
第二轮清了 `.git/index.lock` 之后 `git commit` 还是失败：`cannot lock ref 'HEAD': Unable to create '.git/HEAD.lock'`。
根因：排程沙箱的 fuse mount 对 `.git/` 只有部分写权限，`git commit` 中途被打断会同时留下 `index.lock`、`HEAD.lock`，有时还有 `refs/heads/main.lock`。沙箱内 `rm` 会回 `Operation not permitted`，只能在本机清。
→ **修法：本机收尾指令固定三个一起清**：
`rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock`

**坑 3 — 分行执行、失败不中止 → 推了旧版**（最严重）
第二轮 `git commit` 失败，但下一行 `git push` 照跑，把沙箱先前那个**不含纽西兰卡**的旧 commit 推上 origin/main。Reagan 当下没发现，是我回头看 `git log` 才抓到。
根因：指令分行贴，每行独立执行，中间失败不会阻止后面的 push。
→ **修法：收尾指令用 `&&` 串接，一步失败就停**：

```
cd ~/文件/Claude/cowork/daily-brief && rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock && git add docs/ && git commit -m "Wxx: ..." && git push
```

**坑 4 — push 成功不等于内容正确**
`git push` 印出 `4cec7ef..6551c09  main -> main` 看起来都对，但推的是哪个版本要另外验。
→ **修法：push 后固定跑内容层验证，不只看 commit hash**：
`git log --oneline -2 && grep -c <本周新增关键词> docs/2026-Wxx.html`
本周用 `grep -c 纽西兰 docs/2026-W33.html`，期望 6、实际 6 才算过。关键词挑「这轮改版才有、上一版没有」的词。

**SKILL.md 收尾段要改的**：原本写「跑 prepare-for-github.sh → cp 到 docs/ → git commit + push」是三行分列，改成上面那条 `&&` 串接单行 + push 后 grep 验证。另外沙箱内 git push 本来就被 egress 代理挡（HTTP 403，W31 已记），所以**发布这一步永远是「沙箱产档、本机推送」**，指令品质直接决定会不会推错版本。

---

## 2026-08-02（W31）报告「给老板看、别像 AI、别假设记得上周」——两条硬规则 ✅ 已修

**Reagan 两轮意见**：(1)「de-ai 这份是要给老板们看的，但你的文字永远都像 AI」。(2)「并不是所有老板都知道或记得上周说了什么，且不要带出上周的结论过来，会变成看不懂你在说什么」。第三轮他直接**手改了讯号 01 一段**示范语气，要我照逻辑套全篇 + 整段去重、与上周去重。

**根因**：
1. **de_ai_lint 通过 ≠ 不像 AI**。脚本只查形式层；语意层的翻译腔（「先交代背景」「真正要盯的是」「把 X 跟 Y 连起来看」这种过场 + 机械的「对 X +EV、对 Y -EV」开头）脚本放行，读起来还是 AI。
2. **卡里带「判断维持 W30」「上周悬念揭晓」「W29、W30 已讲透」= 假设读者记得上周**。老板不会记得，这些卡就变成看不懂。旧 SKILL 反而**明文要求**把重复议题降级成「持续追踪」卡 + 写「判断维持 WXX」——这条规则本身就是病根。
3. **篇内重复**：5 大讯号 + §1-§8 把同一件事讲 2-3 遍（signal 是 TL;DR、section 展开），老板读起来是同一个故事重复。

**Reagan 手改示范提炼出的语气规则**（已写进 `_design-notes.md §7.14`）：
- 地名首次出现加中文注：`Wisconsin（威斯康辛州）`；说「州政府」不只说「州」（是 government、不是地理区）。
- 砍过场句：「这周有了两个实打实的答案」「先交代背景」「真正要盯的是」一律删，直接讲内容。
- 「理由：」冒号直切，句子压短，砍次要细节（court split 那种 → 一句「仍有上诉空间」带过）。
- 不写「第一个 / 第二个」这种脚手架，直接流。
- 商家用「商家 / 运营商」，别用「玩家」指公司。

**去重规则**（已写进 `_design-notes.md §7.15` + SKILL 卡数红线松绑）：
- **每个具体事件只给一张完整卡**。5 大讯号就是前五件的完整卡；§ 区**不复述讯号**，只放讯号里没有的新事件（本周：79% 数字、巴西 SPA、Anatel 封号、Betano 份额、DK 产品）+ 加值观察（编辑观察卡）。
- 只为「跟上周去重」而存在的空卡（没新进展的持续追踪）**直接砍**，不占位、不写「判断维持 WXX」。
- **卡数红线 20 张作废**——去重砍出来的 lean 版（W31 = 13 张 col-card + 5 讯号）是对的、不是没料。改成「够就好、去重优先」，只要 judge/pills/hi/cta 的 per-card 比例达标即可。

**⚠️ 跟旧规则的冲突 + 落地方式**：SKILL「重复议题降级成持续追踪卡 + 判断维持 WXX」「卡数 ≥20」两条**跟 Reagan 要的正相反**。新规则写进了 `lessons-learned.md`（本条，SOP step 1 每周必读）+ `_design-notes.md §7.14 / §7.15`（写作规则真值源）——这两个档下周排程会自动读到、以此为准。⚠️ **SKILL.md 本体这次没改成**：它在 app-internal 路径（`~/Documents/Claude/Scheduled/`）、本 session 的 Edit 工具够不到。SKILL 里那两条旧文字还在，但因为 SOP 明文「以 lessons-learned + _design-notes 为准、冲突时听后者」，不影响执行。要彻底一致，Reagan 可手动把 SKILL 那两段也改了（或让我在能存取该资料夹的 session 改）。

**⚠️ 仍靠人工**：语意层像不像人写的、去重够不够狠，脚本查不了。写完自审三题：(a) 这句是跟读者说话还是跟上一版草稿说话？(b) 这张卡拿掉老板有损失吗？没有就砍。(c) 这件事前面讲过了吗？讲过就别再开一张完整卡。

---

## 2026-07-26（W30）为什么「去 AI + 篇内去重 + 跨周去重」每周都被 Reagan 重复纠正 ✅ 已修

**Reagan 质问**：为什么我每周都要重复讲这三点、都记不住吗？

**根因（结构性、不是记性问题）**：三点都写在 SKILL / _design-notes，但**自动关卡查不到 Reagan 真正在意的语意层**——
1. **去 AI**：`de_ai_lint` 只查形式层（黑名单词、第二人称、繁体、斜线）。Reagan 反应的是**句子翻译腔**（「换打法 / 戏码翻转 / 公开下场 / 走到台前 / 头号对手」），这些不在黑名单里、脚本放行 → 每周人工抓。
2. **篇内去重**：**根本没有这道检查**。W30 第一版把「预测市场从州到联邦」同一论点写了 6 张卡，自我验证全过。
3. **跨周去重**：旧检查只比 h4 标题**一字不差**（红线 30%）。标题改几个字就判 0% 通过——Alberta 放两张、§5 EP 照搬上周意思、Gatchalian 几乎原样，全漏。

**修法（三关做成自动挡，下周排程在给 Reagan 看之前就自己抓）**：
- `scripts/de_ai_lint.py` BLACKLIST 加 W30 语意翻译腔词：换打法、戏码（翻转）、反打、拉开差距、走到台前 / 幕前、头号对手 / 威胁、公开下场、下场帮、摊在阳光下、递给立法者、站到台面上。**（加完立刻在自己 W30 草稿上跑，果然逮到 5 处、回头改干净——证明机制有效。）**
- 新写 `scripts/qc_dedup.py`：① 篇内近似标题（字符重叠 ≥0.62）② 讯号 01 核心词出现在 >3 张卡标题 = ✗ 论点铺太多 ③ 同一原文 URL 篇内 ≥3 次 ④「持续追踪」续追卡占比 >35% = ✗ ⑤ 跨周近似标题（≥0.55、不只一字不差、红线 30%）⑥ 跨周同一原文 URL 重复。命中论点铺陈 / 续追过量 = exit 1。
- **weekly SOP 自我验证段要加一行**（下条待办，见下）：`python3 scripts/qc_dedup.py weekly-YYYY-MM-DD.html weekly-{上周}.html`，跟 de_ai_lint 一起跑、exit 0 才算过。

**⚠️ 仍要人工的**：语意层 AI 味（抽象比喻、念给新人听不懂）+ 论点是否真重复（近似标题里有些是 signal↔section 正常交叉引用），脚本只给「疑似 ⚠️」、最终仍靠写完自审。但「同一论点铺 6 张卡」「续追卡照搬上周」这种**量的失控**现在会被 ✗ 硬挡。

**待 Reagan 决定**：要不要把 `qc_dedup.py` 正式写进 SKILL.md 自我验证段（SKILL.md 在 `~/Documents/Claude/Scheduled/weekly-gambling-brief/`、不在本 repo、我改不到）。目前已写进本 lessons + `_design-notes`，下周 run 读 lessons 会看到。

### 新进 de_ai_lint 词表（脚本硬挡，W30）
换打法、戏码、戏码翻转、反打、拉开差距、走到台前、走到幕前、头号对手、头号威胁、公开下场、下场帮、摊在阳光下、递给立法者、站到台面上。

---

## 2026-07-26（W30 第 3 轮）孤行（段末 1-2 字换行）+ index 标题跟正文不同步 📐 设计决策 + ✅ 已修

**Reagan 反馈两点**：
1. **孤行**：多张卡内文段末只剩 1-2 个字（含句号）掉到新的一行（「见讯号 01。」「接充值。」「运。」「报。」「据。」「员会。」「周才跟上。」），很丑。「多这个字元就会多一行，产出排版时多加留意，记住 skills 中，以免下周又要说一次。」
2. **index 标题没跟正文改同步**：docs/index.html 的 W30 desc 还写「预测市场法律战**换打法**（CFTC反告州+AGA**下场**）」——正好是当轮被拉黑的翻译腔词 + 已改掉的框架。

**根因**：
1. 孤行是**渲染层**问题（字数刚好越过整行边界、尾巴掉下来），跟视口宽度有关——每周人工 trim 治标不治本、且换个宽度又冒出来。
2. index desc 是收尾时另手写的一句、没从最终标题同步 → 每次改了正文标题就对不上。

**修法（永久、免下周再说）**：
- **孤行 → CSS 一次解决**：两个 build 脚本在 `</head>` 前注入 `.lead p,.card p,.card .judge,.signal-card .signal-key,.signal-card .signal-judge,.next-list{text-wrap:pretty;}`。`text-wrap:pretty` 是浏览器专门防孤行（短尾行）的属性、**视口无关**、Chrome/Edge 117+ 原生支持、不支持的浏览器无副作用降级。这是**取代每周人工 trim 的正解**。（⚠️ 注：`<style>` 原则上不可改，但这是加一条 additive 排版属性、不动 tokens/layout/class、且修的是反复出现的真 bug——照 SKILL「大改動先記 lessons」流程，已记此条。）
- **最脏的单字孤行仍顺手 trim** 一点当双保险（BofA 内文去「对照数字：」、BofA 判断去「第一个」+「观察→看」、Brazil 判断去「截止」「营运」、CFTC 内文冗句收括号）。
- **发布后线上复验（可选、要 Chrome 在线）**：push 后用 Chrome 开线上 docs URL、跑 `orphan_check` JS（用 Range.getClientRects() 抓每段尾行 px 宽、<44px≈≤3 CJK 字就是孤行）→ 有就回头 trim 再 push。file:// 本机路径 Chrome 扩充打不开（被改写成 https://file///）、只能开线上 URL。
- **index 标题同步 → 硬规则**：`prepare-for-github` / 手动加 index 条目时，desc **直接取讯号 01 + 4 个 signal-card 的 h4 精简串**、不要另手写；产出后 `grep index.html` 的 W30 desc、跟 5 大讯号标题对一遍、含被拉黑的词（换打法/下场…）就是没同步。

**下周 SOP 补两步**（写这里、下周 run 读得到）：
1. 收尾 `prepare-for-github` 后：`grep 'desc">W{N}' docs/index.html` 看标题有没有用到 de_ai 黑名单词 / 跟正文 h4 一致。
2. push 后（Chrome 在线时）线上 docs 跑 orphan_check、复验孤行。

---

## 2026-07-15 · ✅ Git push 流程 + repo 结构（weekly 收尾发布，一次给对指令）

W28 收尾发布时，push 指令来回错了好几次、浪费 Reagan 时间。根因是没先把 repo 环境查清楚就给指令。下次 weekly 收尾**直接照这套、别再试错**：

**repo 结构（真值）**
- git repo 根 = `~/文件/Claude/cowork/daily-brief/`（**整个专案一个 repo**）。
- `docs/` 是**子资料夹、不是独立 repo**——GitHub Pages 从 `docs/` 服务页面。
- 所以 `.git` 在 `daily-brief/.git`，**lock 档、git 指令都要在根目录跑**，不要 `cd docs` 后以为 docs 有自己的 `.git`（它没有，git 会往上找根的 `.git`）。
- remote：`origin` → `https://github.com/Casillaswu/daily-brief.git`，分支 `main`。已设好、不用再 `git remote add` 或 `git push -u`。
- 线上网址：`https://casillaswu.github.io/daily-brief/`（推完 1–2 分钟重建）。

**排程沙箱删不掉 lock（结构性）**
- Cowork 沙箱对 `daily-brief/.git/` 底下的 lock 档是 `Operation not permitted`（macOS fuse 挂载权限），**沙箱里 git commit / push 会失败并留下残留 lock**（index.lock / HEAD.lock / refs 下的 lock）。
- 每次沙箱 git 被中断就多留一个 lock，逐个删很慢。**一次清光**：`find .git -name '*.lock' -delete`（跑前先 `ps aux | grep '[g]it'` 确认没有真的 git 在跑）。

**远端常领先（要先 pull --rebase）**
- 远端 `main` 常有本机没有的 commit（之前某次自动 / 别处推的），直接 push 会被 `! [rejected] (fetch first)` 挡。
- **顺序**：先 commit、再 `git pull --rebase origin main`、最后 push。本机改动会叠在远端最新版之上。
- pull --rebase 若 conflict（远端也动过 `2026-W28.html` / `index.html`）→ `git rebase --abort` 先退回、看 `git log --oneline origin/main -5` 判断，**别 `git push -f`**（会盖掉远端别人的东西）。

**一次给对的完整指令（copy-paste）**
```bash
cd ~/文件/Claude/cowork/daily-brief      # repo 根，不是 docs
find .git -name '*.lock' -delete          # 清残留 lock（沙箱留下的）
git add -A
git commit -m "Wxx: <描述>"
git pull --rebase origin main             # 远端常领先、先接下来
git push
```

**注意**：`prepare-for-github.sh` 重跑**不会覆盖** index.html 里已存在的当周条目（只在不存在时新增）。所以当周 summary 事后要改，得直接手改 `docs/index.html`（+ 若 `2026-Wxx.html` 内容也改了、同步 sed 或重 cp）。

---

## 2026-06-28 · 📐 Reagan W26 逐行 review：标题、de-AI、去重、提议 vs 结论（下次起硬套）

W26 第一版被 Reagan 逐行打回重写，定下一批硬规则——以后每周产出前自查：

**标题（最常犯）**
- **一个标题只放一个重点**。W26 第一版每个标题塞 2-4 个点（「CFTC 反告肯塔基、第 9 州、Bloomberg 爆查 Polymarket」），读者不知道看什么。修法：主标只留最核心一句、其余细节进内文或拆成独立卡。
- **标题要能独立看懂**、不靠内文搭配。「世界杯破纪录从『预估』变『坐实』」这种抽象标题不行——直接写「世界杯成美国体育博彩史上最大赛事：DraftKings 单场是上届卡塔尔 5 倍」。
- **标题别误导**。第一版「CFTC 反告肯塔基…Bloomberg 同周爆 CFTC 查 Polymarket」让人以为是 Bloomberg 在调查。Bloomberg 只是报导方、调查方是 CFTC——主词要清楚。
- **澳门那种标题别写复杂**：要表达「收入下滑」就写「澳门赌场收入要降温」、别把「下修全年 GGR +5.3%、EBITDA 砍半」全堆进标题。

**用语 / 框架**
- **用「民主党 / 共和党」、不要「红州 / 蓝州」**——红蓝州对中文读者要多绕一层。
- **地名带「州」**：肯塔基 → 肯塔基州（不然读者不知道是地名）。
- **术语统一**：选定「体育博彩（sportsbook）」就全文一致、别一会儿「体博」一会儿「线上体育博彩」。nav chip / cat 标签例外（短标签可留）。
- **「死线」→「期限」**（再次确认、W25 已记、W26 又犯一次）。
- **「上周」别写「W25」**：prose 里讲历史脉络用「上周」、跨段引用用「§X」；「W25」这种内部周号别出现在 body 给读者看。
- **解释清楚机制、别留行话**：肯塔基 14.25% 税 = 「用高税逼平台自己退出」、不是干巴巴写「设计来把平台逼到做不下去」。
- **专有名词第一次出现要解释**：SPA = 巴西财政部博彩监管秘书处（第一次出现就给、别假设读者知道）。

**逻辑 / 内容**
- **提议 ≠ 结论**：菲律宾两条电子钱包法案是「提案、还没通过」、要标清楚、别当成已成定局的结论写。
- **别造假关联**：投注额（handle）高 ≠ 有新客进场——这是两件事、龙头「拉新客」是它的策略意图、不是 handle 高的自动结果。第一版把两者画等号、Reagan 抓到。
- **别造错因果**：美国线上赌场只有 8 州合法 vs 体育博彩覆盖 65% 人口——两个都是「各州开放了没」（政府端）、不能说成「人口 / 玩家需求」。比较要同一个轴。
- **EV 判断要讲为什么**：「对多产品线 +EV、对只做足球盘 -EV」后面必须接原因（足球盘薄利、要靠赌场交叉销售赚钱）、不能只丢结论。
- **没核实的别写**：FIFA「官方预测市场」我没实际查证就写进去、其实是 Polymarket / Kalshi 在做 World Cup 盘、不是 FIFA 自营。规则：写产品前先实际查证（网址 + 特点）、查不到就直接拿掉那张卡、别硬凑。

**去重（整篇、不只标题）**
- 跨周标题 diff 0% 不代表没重复。**同一件事在 §2 / §3 / §4 / §8 反复讲也是重复**。W26 第一版世界杯纪录在 Signal 02、§3、§4、§8 各讲一遍。修法：Signal 02 = sportsbook 纪录、§3 = 预测市场角度、§4 = 龙头策略（不重列数字）、§8 = 一句总结、各段角度不同、不重复堆数字。

**前端不写内部讯息（再次确认）**
- promo 卡别写「实抓」「抓取」——读者不知道你抓了什么、写「本周监测…」即可。
- BingoPlus「内文被登入墙挡住、需人工确认」这种是内部 ops 状态、**不写前端**、留在 snapshot json；抓不到就重抓或不写那张卡。

**Editor's Pick**
- 别写一堆「切不同需求、产品做得比想象细、不再是猜测」这种 AI 抽象堆叠——讲具体：谁、做了什么、对 Reagan 的工作意味什么。
- Editor's Pick 标题如果要带「（W26）」、前面加「本周」（本周亚洲市场观察（W26））；纯「大运营商要多盯一类对手（W26）」这种看不懂、要改成讲清对手是谁（「大运营商要多盯的新对手：预测市场平台」）。

**W26 第三轮再补的细节（标题措辞 + 删冗字）**
- 标题别用「挡下…的封杀」这种绕的说法——正面讲诉求：CFTC 是「要让『预测市场归联邦管』成立」。
- 「同一个 CFTC」这种强调词读者看不懂——直接「CFTC 一边…一边…」。
- 破纪录类标题直接把「破纪录」写进去：「世界杯破纪录、为美国体育博彩史上最大赛事」。
- 「传出在谈估值」标题够了、body 不用再写「要标清楚：这是在谈、还没敲定」——啰嗦。
- 「政治表态、不是立法」这种 caveat 不用单独一句强调（读者懂）——并进句子或删掉。
- handle 高 ≠ 新客、也 ≠ 赚钱：§4 标题改「龙头看的不只是这届赚多少、更是拉到多少新客」、别写「不指望靠这届赚钱」（谁不在乎赚钱、要讲「为之后布局」）。
- 州数用具体数字、别用「覆盖 65% 人口」（读者难懂、还被误解成玩家需求）：线上赌场 8 州 vs 线上体育博彩约 30 州、同一个「各州开放了没」的轴。
- promo 卡标题：「无更新、跟上周一样」就好、别堆「都在 PAGCOR 规范内」。
- 数字 stat 要讲清是什么：「全球总投注估 $50B+」要补「美国占其中一部分」、否则跟美国 $3.3B 摆一起读者懵。
- 能省字就省（Reagan 多处标「减少 N 个字」）：「密集对外发言」→「密集发言」、「股东批准和监管审批」→「股东和监管审批」、「最难反驳的一条素材」→「最难反驳的素材」、「同一场世界杯」→「同场世界杯」。

---

## 2026-06-21 · 📐 Reagan 用语与写法偏好（W25 逐行 review 累积，下次起遵守）

W25 第二轮 Reagan 逐行 review，定下一批硬偏好——以后每周直接套，别再犯：

**用语**
- **AG = 检察总长**，不是「总检察长」。
- **handle 在标题里一律写「投注总额」**（body 第一次出现可 `投注总额（handle）` 带英文、之后看情况）；纯写 handle 当标题读者看不懂。
- **「赌收」一律改「营收」**（GGR 解释照旧「毛博彩收入」）。
- **「日均跑速 / run-rate」改「每日平均营收」**——跑速是行话、读者看不懂。
- **Super Bowl 写「超级杯」**（Reagan 用语）、首次出现加「（Super Bowl、美式足球 NFL 年度冠军赛）」。
- **「死线」改「期限 / 最后期限」**；「死线临近」→「期限临近」。
- **「官司全开 / 战线全开」别用**——改「多线官司 / 多方同时开打」具体讲。

**结构 / 写法**
- **不写「上周提要」**——「W24 写的是…这周…」这种开头删掉、直接讲本周的事。要带历史脉络就一句话融进句子、不要单独一段回顾。
- **世界杯 vs 预测市场不要硬绑一起下结论**。两者是不同产品、不同口径：sportsbook「投注总额 handle」≠ 预测市场「成交量 volume」（一个玩家下注金额、一个金融合约面额）、**不能比大小**。W25 第一版把 PM 单周 $8.7B 跟 sportsbook 整届 $2.82–4.3B 摆一起、Reagan 以为数学错了。修法：把 $8.7B 移到 §3 讲清楚口径、Signal 01 只讲官司、Signal 02 只讲 sportsbook 投注总额。
- **上周讲过、这周没新进展的，别再开一张卡重复**。W25 删了 §3 世界杯老虎机卡（W24 已报）、§5 B2B 执行细则卡（跟 Signal 05 重复）、§1 跨市场观察 Editor's Pick（那是总结、不是法规、不该塞 §1）。**Editor's Pick 那种「我的总结」不要放进 §1 法规区**。
- 操作建议要**具体、能照做**，别写「合规叙述补一句」这种没说要补什么的空话。

> ⚠️ 副作用：照 Reagan 删重复卡后 W25 只剩 17 张卡（< SKILL 的 ≥20 红线）。这是**operator 主动要求去重**的结果、不是讯号不足、不要为了凑 20 硬塞回灌水卡。SKILL 的 ≥20 是防「漏报」、跟「主动精简」冲突时以 operator 为准。

---

## 2026-06-21 · ✅ 真·跑版 bug：W25 HTML 漏了 `<main class="page">` 开标签（生成器切 head 切掉了）

### 背景

Reagan 比对 W24 vs W25 截图——W25 整页内容贴著浏览器左上角、没有留白边距（W24 有正常 28px padding + 1200px 居中）。这才是他说的「跑版」，不是上面那条 h2-en 标签问题。

### 根因

W25 HTML 用 generator（`build_w25_html.py`）产：`head = src[:src.index("<body>")+len("<body>")]`、再接手写的 `BODY`。但原始 W24 结构是 `<body>\n\n<main class="page">\n` ——`<main class="page">` 在 `<body>` **之后**、属于 body 区。切 head 只切到 `<body>`、`<main class="page">` 开标签就被丢了；BODY 又是从 `<!-- MASTHEAD -->` 开始写、结尾却有 `</main>`。结果：**有 `</main>` 闭标签、没有 `<main class="page">` 开标签**。

`.page` 这个 class 提供 `max-width:1200px; margin:0 auto; padding:28px 32px; background:#fff`——开标签丢了、整页就没这些、内容贴边 = 跑版。

之前的 tag 平衡检查只查 `section/article/div/h2/h3/h4/span`、**没查 `main`**、所以漏了（main 0 开 / 1 闭）。

### 已修（2026-06-21）

- 4 个 W25 档（工作版 CN/EN + docs CN/EN）`<body>` 后补回 `<main class="page">`、2 个 generator 的 BODY 开头也补。
- 重新生成 + 全验证、main 1/1 平衡。

### 防呆（已纳入下次必做）

1. **tag 平衡检查必须含 `main`**（还有 `header/nav/main/footer` 这类单例容器）——不只查 card 级别的 tag。一个稳的查法：
   ```python
   import re
   c=open(F).read()
   for t in ['html','head','body','main','header','nav','footer','section','article','div','h1','h2','h3','h4','span','p','ul','ol','li','a']:
       o=len(re.findall(r'<'+t+r'(\s|>)',c)); cl=len(re.findall(r'</'+t+r'>',c))
       assert o==cl, f'{t} {o}/{cl} MISMATCH'
   ```
2. **generator 切 head 的边界要切在 `<main class="page">` 之后、不是 `<body>` 之后**——或者 BODY 自己带 `<main class="page">` 开标签（W25 已改成后者）。
3. 产完 HTML **一定要实际渲染看一眼**（或起码肉眼扫开头有没有 `<main class="page">`），别只信 ratio / 字数检查——跑版是结构问题、ratio 全过也可能跑版。

---

## 2026-06-21 · ✅ section-head h2-en 跑版 bug：`<span class="h2-en">` 误用 `</h2>` 收尾（W22 起继承）

### 背景

W25 第一版交付后 Reagan 反映「版面跑版」。查出根因——§2 M&A 的 section-head 里、英文副标这行：

```html
<h2>M&amp;A 与资本动作</h2>
<span class="h2-en">M&amp;A &amp; Capital Moves</h2>   <!-- ✗ span 用 </h2> 收尾 -->
```

`<span class="h2-en">` 被 `</h2>` 收尾、不是 `</span>`。结果 span 永远没闭合、把 §2 之后整段 markup 都吞进 `.h2-en` 的样式（小号、灰、大写字距），从 §2 开始版面就垮。tag 平衡检查抓得到：修前 CN 档 `h2 11/12`、`span 198/197`。

### 影响范围（继承自 W18 News Clipping 模板）

不是 W25 独有——`<span class="h2-en">M&A & Capital Moves</h2>` 这个 bug 从模板一路继承。实扫命中 8 个档：`weekly-2026-05-31/06-07/06-14(.html + -en)` + `docs/2026-W22/W23/W24(.html + -en)`。**只有 §2 这行中招**（因为它的 h2-en 文字含 `&`、当初手写时收错标签）、其他 section 的 h2-en 都正常 `</span>`。

### 已修（2026-06-21）

- 通用 sed 修全部命中档 + W25 四档（工作版 CN/EN + docs CN/EN）+ 两个 generator 脚本：
  `s#\(<span class="h2-en">[^<]*\)</h2>#\1</span>#g`
- 修后全部 tag 平衡（section/article/div/h2/h3/h4/span 开闭相等）。

### 防呆（下次必做）

1. **weekly 自我验证加一条 tag 平衡检查**——产完 HTML 后跑 `h2 / span / div / article / section` 开闭计数、不等就 FAIL。比肉眼看渲染可靠。
   ```python
   import re
   c=open(F).read()
   for t in ['section','article','div','h2','h3','h4','span']:
       o=len(re.findall(r'<'+t+r'[ >]',c)); cl=len(re.findall(r'</'+t+r'>',c))
       assert o==cl, f'{t} {o}/{cl} MISMATCH'
   ```
2. 复制 weekly 基底时、section-head 的 `h2-en` 一律 `</span>` 收尾——特别是含 `&amp;` 的（§2 M&A）最容易手滑写成 `</h2>`。
3. `_design-notes.md §2` 的 section-head 范本已是对的（`<span class="h2-en">…</span>`）、bug 是历史手写漂移、不是范本错。

---

## 2026-06-01 · 📐 De-AI 形式层脚本化：scripts/de_ai_lint.py + 接进 weekly 自我验证

### 背景

Reagan 问「De-AI（去 AI 味）要建什么才能达成」。**关键认知**：De-AI 规则其实早就写全在 `_design-notes.md §7.1-§7.12`，问题是散落 + 全靠肉眼挑、每周漏网（W22 连改好几轮才清干净）。

**De-AI 分两层**：
- **形式层**（可机械查）：黑名单词、第二人称「你」、繁体残留（含週）、斜线分隔、「对 Reagan」 → 脚本化
- **语意层**（查不了）：「这句是不是抽象比喻」「念给新人听懂吗」「因果链清不清楚」 → 只能 Claude agent 写作时自律 + 写完自审。**这层才是最 AI 味的、但没工具能解、别幻想脚本搞定。**

### 已建（2026-06-01）

`scripts/de_ai_lint.py`——形式层一次扫光、命中列行号 + 改法、exit 1；全干净 exit 0。
- 字典全部来自 `_design-notes §7`、不自创。
- **已踩准两个误报陷阱**（建脚本时实测修掉）：
  1. 「布局」不是黑名单——§7.7 原文是繁体「佈局」、简体「布局」是正常中文动词。只查「佈」。
  2. 斜线分隔豁免「资料标签场景」（§7.10 明文）——标题行 / section-head / cat 分类标签 / 短标签短语（≤24 字无标点）不报。只报读句里的斜线（如「责任博彩 / 监管圈」→ 改「与」）。
- 用法：`python3 scripts/de_ai_lint.py weekly-YYYY-MM-DD.md weekly-YYYY-MM-DD.html weekly-YYYY-MM-DD-en.html`
- EN 档自动只查 EN 黑名单（battlefield 等）、不查繁体 / 中文第二人称。

### 已接进 weekly（SKILL.md 自我验证段）

取代旧的单行黑名单 grep（de_ai_lint 是超集）。**W23 起排程跑 weekly 时自动跑、命中逐条改到 exit 0**。验证项清单也改成「De-AI 形式层 = 0 命中」。

### 维护

之后 Reagan 再抓到新的 AI 味词 → 加进 `de_ai_lint.py` 的 `BLACKLIST` dict（简 + 繁 + 必要时 EN），不要只记在脑里。这就是「学到新偏好就记进工具、不靠下次自律」。

---

## 2026-06-01 · 📐 发布分工：git push 由 Reagan 手动、Claude 只列改动清单

**Reagan 明确指示**：git push 以后都他本机手动做（沙箱连不上 GitHub、本机最快）。

**所以跑 weekly / 改任何档之后**：
- ✅ Claude 负责：产出 / 修改档案、自我验证、把档放进对的位置（docs/、scripts/、weekly md+html 等）、**结尾用一两行列出「这次动了哪些档」**方便 Reagan `git add`。
- ❌ 不要再做：贴整套 `git add / commit / push` 指令流程、不要每次结尾啰嗦 push 步骤（Reagan 嫌慢、他自己会 push）。
- weekly 收尾照样把 docs/ + weekly 档备好 + 列清单，push 留给 Reagan。

---

## 2026-06-01 · 📐 ph_promo_snapshot.py 加 Firecrawl 抓取层（urllib → Firecrawl → Playwright 三层降级）

### 背景

Reagan 装了 Firecrawl + Brave Search 两个 MCP、问能不能用进排程。**关键认知（Reagan 点破）**：competitor-weekly / trigger-monitor / daily-brief / ph_promo 这些是 **launchd 跑的纯 Python 脚本、不是 Claude agent**——所以走 MCP 没意义、MCP 是给 Claude agent 用的。**正解：在 Python 里直接 call Firecrawl HTTP REST API**（不需要 MCP、不需要 pip 装 firecrawl SDK、urllib 标准库就能 call）。

### 为什么是 ph_promo 先接

7 家 PH 持牌运营商 promo 页全是 client-rendered（JS 渲染）、urllib 抓到空壳、原本只能靠 Playwright。但 Playwright 在 launchd 又重（要 ~150MB Chrome binary）又脆。Firecrawl 一个 HTTP call 回渲染后 markdown、稳得多、launchd 友好。

### 改了什么（已落地，2026-06-01）

`scripts/ph_promo_snapshot.py` 抓取改成**三层降级**：
```
urllib（标准库，先试）
  ↓ 抓到 SPA 空壳就降级
Firecrawl（首选 fallback）← POST https://api.firecrawl.dev/v1/scrape、formats=["markdown"]、onlyMainContent、waitFor=2500
  ↓ 没 key / 额度用完 / 失败就降级
Playwright（最后保险）
```
- 新增函数 `fetch_firecrawl(url)`（在 `fetch_playwright` 后面）、纯 urllib call REST API。
- 新增 key 读取 `_load_firecrawl_key()`：**env `FIRECRAWL_API_KEY` 优先、其次 `.secrets/firecrawl_key.txt`**（跟 xai_key.txt 同款）。
- 调用链（snapshot_operator 内）：urllib 空壳 → 先 Firecrawl、失败才 Playwright。
- **没设 key = Firecrawl 自动跳过、降级 Playwright、脚本照常跑不会挂**（已实测：未设 key 时 `fetch_firecrawl` 回 `(0,"",​"key not set")`、调用端干净降级）。
- `py_compile` 通过。README 同步更新（依赖段 + 三层降级说明）。

### ✅ Firecrawl 已启用（2026-06-01 Reagan 已填 key、确认生效）

- key 已放 `.secrets/firecrawl_key.txt`（Reagan 6/1 填入、脚本实测读到、`.gitignore` 第 19 行 `.secrets/` 已挡、不会 push 外泄）。
- **W23 起排程跑 ph_promo 时 Firecrawl 自动生效、不用再做任何事**——脚本自己读 key、SPA promo 页走 Firecrawl 渲染。
- 占位符保护已加：key 若是 `PASTE_*` / 空 = 自动当没设、降级 Playwright、不会拿假 key 撞 401。
- 备注：launchd plist 里设环境变量 `FIRECRAWL_API_KEY` 也行（env 优先于档案）；Firecrawl 免费额度跑 7 家 promo 页绰绰有余（每周 7 次 scrape）。

### Brave Search 为什么这次没接

Brave 是要替代「网页搜寻」。但 weekly brief 的搜寻是 **Claude agent（跑 weekly 的我）用内建 WebSearch**、不是 Python 脚本——所以 Brave 在脚本端没有可插入的点。除非未来某个 Python 脚本（如 trigger-monitor / competitor-weekly）里有「脚本自己要搜网页」的需求、才值得照同款 `fetch_firecrawl` 模式加一个 `brave_search(query)` 函数 call Brave HTTP API。**目前 daily-brief/scripts/ 里只有 grok_x_search.py + ph_promo_snapshot.py 两支**；trigger-monitor / competitor-weekly / daily-brief 那几支脚本不在这个资料夹、若要接 Firecrawl/Brave 得先拿到那些脚本。

### 通用模式（之后接其他脚本照抄）

launchd Python 脚本要用任何「需要 API key 的 web 服务」（Firecrawl / Brave / xAI…）：
1. key 放 `.secrets/{service}_key.txt`、读取时 env 优先。
2. 用 `urllib.request` POST REST API、不要装 SDK（launchd 环境干净最稳）。
3. 包成一个 fetch 函数、没 key / 失败时 return `(0,"",err)`、让调用端降级、**绝不让脚本 crash**。

---

## 2026-05-29 · 📐 W22 起加 PH 7 家持牌运营商 promo 监测清单

### 背景

Reagan 5/29 给的 7 个 PAGCOR 持牌运营商 promo 页面 URL、要每週抓、跟 PAGCOR 5/7 新规（cashback ≤ 15% / rebate ≤ 1.5%）做合规执行面对照。这是 W22 §5 亚洲 / 菲律宾 card 的核心新内容。

### 7 家运营商 promo URL 清单（已写进 SKILL.md L114）

| 运营商 | Promo URL | 类型 |
|---|---|---|
| OKBet | `https://www.okbet.com/reward-center` | sportsbook + casino |
| BingoPlus | `https://bingoplus.com/promo` | DigiPlus / AB Leisure 旗下、bingo + casino |
| ArenaPlus | `https://arenaplus.ph/promo` | Solar Sports 旗下、sportsbook + iGaming |
| HawkPlay | `https://www.hawkplay.com/bonuses?locale=en` | PAGCOR PIGO 持牌 |
| Jiliko | `https://www.jiliko1225.co/promotion` | JILI 旗下 slot / casino |
| MSW（Megasportsworld）| `https://sports.msw.ph/en/info/promotions2` | PAGCOR 持牌、sportsbook |
| Solaire Online | `https://www.solaireonline.com/promotions` | Solaire Resort 旗下 |

### URL 校正（Reagan 给的 raw URL 跟实际 canonical 不一样）

- HawkPlay：Reagan 给 `wwww.hawkplay.com`（4 个 w、typo）→ 实际 `www.hawkplay.com`
- Jiliko：Reagan 给 `?version=6.45.3-fckol.0` 这种 version 参数会变 → 抓 base URL `/promotion` 即可、不要写死 version

### W22 跑 weekly 时怎么用

1. **抓什么**：每家 promo 页面的「cashback %」「rebate %」「deposit bonus」「freebet」「VIP tier 规则」5 个核心字段
2. **怎么跟上周比**：snapshot 存 `snapshots/2026-Wxx/ph-promo/{operator}.md`、跑 diff
3. **写进 weekly 哪里**：§5 亚洲 / 菲律宾 card 加一张「PAGCOR 5/7 新规第 X 周合规检查」card、列：
   - ✓ 已下架 cashback > 15% 的 / 已调成 ≤ 15% 的
   - ⚠️ 还在卖 cashback > 15% 的（PAGCOR 不合规候选名单）
   - 新加的 promo / 撤下的 promo

### 抓 promo 页面的技术备注

- 多数页面 client-rendered（JS 渲染）、WebFetch 抓不到完整内容
- 要用 Claude in Chrome 的 `navigate` + `get_page_text` 跑
- 部分页面有 geoblock（IP 限制）— PH IP 才能看完整 promo、海外 IP 看到精简版
- HawkPlay `?locale=en` 强制英文、不带这参数会跳回 Tagalog

### Reagan 本机排程建议

跟 grok_x_search.py 一起、周日早上跑：

```bash
# 假设之后写 scripts/ph_promo_snapshot.py（待开发）
0 8 * * 0 cd ~/文件/Claude/cowork/daily-brief && \
  python3 scripts/grok_x_search.py weekly && \
  python3 scripts/ph_promo_snapshot.py
```

### 已完成（5/29 当晚）

- ✅ `scripts/ph_promo_snapshot.py`（5/29 写完、24KB、含 README）
  - urllib 主、Playwright fallback（client-rendered 页面）
  - ⚠️ **2026-06-01 更新**：抓取已改三层降级 urllib → **Firecrawl** → Playwright（见顶部 06-01 条目）。下面「装 Playwright 强烈建议」已不再是唯一解——优先设 Firecrawl key、Playwright 退成备援。
  - 抽 cashback %、rebate %、bonus PHP 金额、freebet / VIP 提及数
  - 合规判定 3 态：compliant / non_compliant / **unknown**（抓不到时不算合规、不算不合规）
  - Snapshot 存 `snapshots/2026-W{NN}/ph-promo/{slug}.txt`、master 输出 `/tmp/ph-promo-snapshot.md`
  - 跟上週 diff（字段层级 + 句子层级）
  - sandbox 测试不能 access PH 域名（proxy 403）、但**脚本本身 syntax + 流程 + 错误处理全 work**、Reagan Mac 上跑应该正常

### Reagan 5/31 周日 8:00 第一次跑前要做

1. **（优先）设 Firecrawl key**（2026-06-01 起、比 Playwright 稳、不用装 Chrome）：
   ```bash
   echo "fc-你的key" > ~/文件/Claude/cowork/daily-brief/.secrets/firecrawl_key.txt
   ```
   或装 Playwright 当备援（Firecrawl 没 key / 额度用完才会用到）：
   ```bash
   pip3 install --break-system-packages playwright
   playwright install chromium
   ```
2. 试跑一次确认 7 家都能抓：
   ```bash
   cd ~/文件/Claude/cowork/daily-brief
   python3 scripts/ph_promo_snapshot.py
   ```
3. 设 cron 每周日 8:00 自动跑（跟 grok_x_search.py 一起）：
   ```bash
   crontab -e
   # 加：
   0 8 * * 0 cd ~/文件/Claude/cowork/daily-brief && \
     python3 scripts/grok_x_search.py weekly > /tmp/x-weekly.log 2>&1 && \
     python3 scripts/ph_promo_snapshot.py > /tmp/ph-promo.log 2>&1
   ```

---

## 2026-05-29 · 📐 W22 起新增越南区域 — 跨档同步完成

### 背景

Reagan 5/29 决定 weekly brief 新增越南观察区。理由：
- 2025/11/26 Resolution 8/2025/NQ-CP 生效、Corona（Phu Quoc）拿永久 license、Grand Ho Tram + Van Don 5 年 pilot 让越南公民境内合法 gamble
- 越南灰市规模 $10B/年（W88、M88、188bet、12BET、FB88、CMD368、K8 等离岸运营商主导）
- 越南是菲律宾近邻、亚太博彩生态重要补充

### 跨档同步动作（5 个档）

**1. `_sources.md`**：新增「越南专区」section（L97）
- Tier 1: VnExpress International、VietnamNet、Vietnam News、Tuoi Tre News、AGB Vietnam、iGB Asia Vietnam、IAG
- Tier 2: Casino.org Vietnam、SCCG、Duane Morris Vietnam Blog、Vietnam Investment Review、VnEconomy
- 越南专属执行面 query + 每周 checklist

**2. `_x-monitoring.md`**：新增 §4 越南（L167）+ 重排 §5 Grok / §6 過濾 / §7 維護
- 官方 / IR / 媒体 / KOL 帐号清单
- 关键字（含越南文 cá cược / sòng bạc / đua ngựa / đặt cược thể thao）
- Grok 查询模板（英 + 越双语）

**3. `scripts/grok_x_search.py`**：新增 `vietnam` query（L121-160）
- weekly mode 改成 `["brazil", "na", "vietnam"]`（原 `["brazil", "na"]`）
- daily mode 改成 `["brazil", "na", "asia", "vietnam"]`
- 增加成本预估：+ $0.003/週 ≈ + $0.013/月（约 30% 增）

**4. `SKILL.md`**：
- 角色定位：「主戰場菲律賓 + 巴西、新增觀察區越南 2026-05-29」
- §6 過濾「收」清单亚洲段补：「越南 Phú Quốc・Hồ Tràm・Vân Đồn + 离岸 W88/M88/188bet 等」
- §5 章节标题：「亞洲（菲律賓 / Macau / **越南** / 東南亞）」

**5. `lessons-learned.md`**：本条目（5 个档完成同步备忘）

### W22 weekly 跑时的注意点

- **§5 亚洲 section** 现在涵盖 4 块：菲律宾 / Macau / 越南 / 东南亚——越南内容应独立成 card、不要塞进「东南亚」泛称
- **越南内容优先抓什么**：(a) Resolution 8/2025 落地情况；(b) Corona / Grand Ho Tram / Van Don 三家境内 IR 财务 / 营运公告；(c) 离岸品牌 ISP 封锁 / 法律执法动态；(d) Vingroup / Sun Group / ACDL 母公司 M&A
- **越南文 keyword 必须用**：Grok 不会自动搜越南文、要在 prompt 明确指示「Search in English AND Vietnamese」
- **本地 KOL 在 X 弱**：越南 sports betting KOL 主战场是 TikTok / Facebook、X 上活跃度低——所以 Grok 抓到的多是媒体官方帐号、不是 KOL 个人 take

### 越南区域成本预估

| 模式 | 频次 | 单 query 成本 | 月成本 |
|---|---|---|---|
| weekly（BR + NA + VN）| 3 query/週 × 4 週 | ~$0.003 | ~$0.036/月 |
| daily（4 市场）| 4 query/日 × 30 日 | ~$0.003 | ~$0.36/月 |

预设只跑 weekly、~$0.04/月、几乎可忽略。

---

## 2026-05-29 · ✅ W21 跑事后用 Grok x_search 验证、抓到 W21 漏抓的料

**背景**：W21 weekly 跑完后部署了 grok_x_search.py（xAI Agent Tools API 真版）。事后 5/29 跑 weekly mode、用 Grok x_search 直接抓 5/22-29 X 信号、跟 W21 §9 内容比对。

### finding 1：W21 §1 / 讯号 02 实际漏抓 **Rhode Island AG 5/22 起诉 Kalshi + Polymarket**

**原始来源**：@WALLACHLEGAL 5/22 + 5/26 三连贴文 + RI AG 引用「we demand Kalshi and Polymarket stand down... disgorge their profits」。Grok x_search 在 NA 5 条命中里有 3 条都是这条。

**为什么 W21 漏**：当时 WebSearch fallback 用主流媒体（CNBC、Roll Call、Bloomberg）抓 House Oversight + 9th Circuit + India、确实没主动搜「Rhode Island」「state AG sues Kalshi」这种州层级新讼。@WALLACHLEGAL 的 X 推文是更早、更新、更密集的 signal。

**实际正确写法**：W21 讯号 02 应该是「**Kalshi、Polymarket 一周四连击**」：
1. 5/22 美国国会 House Oversight 内线交易调查（含 Iran 80+ 笔可疑交易具体细节）
2. 5/21 第九巡回否决联邦化
3. 5/22 **Rhode Island AG 起诉 Kalshi + Polymarket、要求 disgorgement**（漏抓）
4. 5/21-22 印度 ISP 封锁

**修法**：
- W22（2026-06-07）weekly 开头追写「W21 漏掉的 Rhode Island AG 案的 follow-up」
- 把 Wallach 是「美国 sports betting law 第一名嘴」从 `_x-monitoring.md` 备注升级到 SKILL.md SOP step 4 主声明、强制每周 weekly 用 grok 抓 Wallach 过去 7 天所有推文

### finding 2：Grok x_search Brazil query 过滤太严、0 命中但搜了 10 篇

**症状**：BR 报「No high-signal posts found in this window」但 citations 段列了 10 个 x.com URL。代表 Grok 真去搜了、但 prompt 里的「SKIP odds, promo codes, fan sentiment, retweets without quote, pure ads」让它把所有候选过滤掉了。

**根因**：巴西博彩 X 帐号（Betano / bet365 / iGamingBrazil 等）日常推文 70% 是促销 + 赛事 promo、单纯写「SKIP odds + promo」会全砍光。

**修法**（已经在 task #18 跑）：
- 把「SKIP」改成「DEPRIORITIZE」、让 Grok 知道这些低权但不一定丢
- 加 Portuguese 关键字：`Search posts in Portuguese OR English about: "casa de apostas", "regulamentação", "SPA", "Anatel"...`
- 提高 max_results、看 Grok 自己怎么选

### finding 4：Brazil 5/22-29 X 信号全 LOW 揭露的 meta-finding

**症状**：BR 跑出 5 条全 [SIGNAL: LOW]，2 条 Betano / NBA 是促销 / 投注分析、其他 3 条（@AnatelGovBR / @MinFazenda / @CarlosZarattini）跟博彩无关。

**meta-finding**：@MinFazenda + @CarlosZarattini 这两条都在庆祝 **5/28 国会通过结束 6x1 工时改革**。这是巴西过去一年最大的劳工议题、5/28 联邦议程被这件事整天吃掉。

**downstream 推论**（W22 §6 拉美直接能用）：
- W21 追的 PL 2.985 5/28 senate vote（全国级博彩广告法）**很可能被推迟 / 没上议程 / 被淹没**
- Anatel 本周也没新平台封锁、SPA 没新罚单
- 这是「监管议程被排到 Q3 之后」的信号 — 巴西博彩业者多了 2-3 个月缓冲期

**规则**：下周 W22 跑 weekly 前先用 `web_fetch` 抓 Brazil Senate 5/28 议程实际结果（http://www.senado.leg.br/atividade/pauta/ ）、确认 PL 2.985 是延期还是真过了。

**总结**：grok_x_search.py 跑「全 LOW」的输出本身就是 finding、不是 prompt 问题。下次出现类似情况、把那些「跟博彩无关但被博彩相关帐号在转发的政治议题」直接写进 weekly 作为「为什么博彩本周静」的背景脉络。

### finding 3：Grok 4.3 比预估贵 3x

**原始预估**：weekly 2 query ≈ $1.2  
**实际 Grok 4.3**：可能 $3-5/次（model 价差 + tool invocation 多收）  
**修法**：日常 weekly 用 `MODEL = "grok-4-fast"` 省 60-70%；只有大事件深掃時改回 4.3。

下周起 `grok_x_search.py` 预设 MODEL 调成 grok-4-fast、留 doc 注解「跑深掃改 grok-4.3」。

## 2026-05-29 · 📐 W22 起 X Pulse 强制走 Grok API、不再用 WebSearch fallback

W21 跑事后用 Grok x_search 验证（见上一条 finding）确认：fallback 漏掉 RI AG 案、漏掉 Wallach 律师 thread、漏掉巴西议程被排挤的 meta-finding。**这些都是 fallback 抓不到、只有 Grok x_search 能抓的圈内一手 alpha**。

W22 起、weekly task SOP step 3 改写：

**新 SOP**：
```
3. 跑 X Pulse：
   先看 /tmp/x-weekly.md 档案修改时间：
   ls -la /tmp/x-weekly.md
   - 若 mtime 是本周日 → 直接 cat /tmp/x-weekly.md 当 §9 输入、不再跑脚本
   - 若 mtime 是上周或更早 → Reagan 本机没跑 / 跑失败、立即停下任务、报给 Reagan：
     「/tmp/x-weekly.md 是 YYYY-MM-DD 的旧档案、不是本周。请在 Mac 终端跑
     `cd ~/文件/Claude/cowork/daily-brief && python3 scripts/grok_x_search.py weekly`
     跑完再回来继续 weekly。」
```

**不允许的 fallback 行为**（写进规则、防 Claude 又走老路）：
- ❌ 用 WebSearch 自己抓 X 内容塞进 §9（W18-W20 旧做法、品质差太多、信号延迟 6-24 小时）
- ❌ 跳过 §9 X Pulse 章节（这是头条之外最高 ROI 的章节）
- ❌ 把「未跑 Grok」当 internal-ops 写进前端（按 W19 规则「内部 ops 不写前端」、要么跑、要么停）

**环境就位状态**（5/29 实测）：
- `.secrets/xai_key.txt` ✓ 84 字 xAI key
- `scripts/grok_x_search.py` ✓ 用 Agent Tools API（`responses.create` + 内建 `x_search`）
- 实测：HTTP 200、grok-4-fast model work、单 query 成本 $0.003、抓到的 X 贴文含原始 URL

**Reagan 本机排程建议**（让每周日早上 8:00 自动跑、Claude 9:00 跑 weekly 时直接能 cat）：
```bash
crontab -e
# 加这行：
0 8 * * 0 cd ~/文件/Claude/cowork/daily-brief && python3 scripts/grok_x_search.py weekly > /tmp/x-weekly.log 2>&1
```

---

## 2026-05-24 · 📐 W21 第三轮规则补充（阅读疲劳 / 空话卡 / 中英混用 / 术语解释）

> **W21 第一版踩的坑**：机械跨周重复率 0%（标题字符串全不同）、但 Reagan 实际读起来感受到「翻一页又是看过的、再翻一页又是 W20 维持」。诊断：52 张 card 里 15 张（30%）在说「本周没新进展、跟上周一样」+ 7 张 jump card 在 §7 §8 重述其他 section 内容。

### 规则 22：Editor's Pick 不在轮换周期就完全不放、不要塞「W20 维持，无更新」当借口

**W21 第一版负面案例**：8 张 Editor's Pick 全部写「W20 论述 X 本周加码、Editor's Pick 4 周才换一次、本周维持 W20 观察」——同一句式重复 8 次、读者读到第 3 个 section 就疲劳。

**修法**：SKILL.md「Editor's Pick 4 周才换一次」规则的正确执行 = **其他 3 周整张 card 删掉、不放占位卡**。不要写「维持 W20 观察」当占位字。

下周 W22 起：Editor's Pick 没轮换就完全不出现在 HTML（CSS 排版自然不留空）。

### 规则 23：W20 持续追踪 card 上限 3 张、超过的统一压成 §10 前的 mini-list

**W21 第一版负面案例**：10 张「W20 持续追踪」卡占 19% 版面、每张都是「W20 已完整报。本周无新动向」的雷同句式。

**修法**：
- 单 section ≤1 张「W20 持续追踪」卡、且仅当上周议题在本周有新进展角度时保留（如本周写了讯号 02 三连击、Kalshi 估值确实因此承压、就重写成完整卡）
- 其他纯「无新进展」议题统一汇成 §10 前的「📎 W20 已报、本周无新进展（一行带过）」mini-list

mini-list 样式（CSS inline、不需新增 .class）：
```html
<div style="background:var(--paper-2);border-left:3px solid var(--ink-3);padding:14px 18px;margin-bottom:18px;font-size:12px;line-height:1.85;color:var(--ink-2);">
  <div style="font-size:11px;letter-spacing:.22em;color:var(--ink);font-weight:800;text-transform:uppercase;margin-bottom:8px;">📎 W20 已报、本周无新进展（一行带过）</div>
  ·&nbsp;<b>议题</b> — 1 句状态<a href="原文URL" target="_blank" rel="noopener">[原文]</a><br>
  ...
</div>
```

### 规则 24：每个 section 最多 1 张 jump card；超过 1 张就改成顶部 mini-list

**W21 第一版负面案例**：§7 北美 5 张 card 里 4 张是「详见 §X / 详见讯号 0X」、§8 体博 3 张全是 jump card。读者读到 §7 §8 看的是「同一件事第 4 次重述」。

**修法**：
- 每个 section 最多 1 张 jump card（这张必须有该 section 独特的角度补充、不是单纯重述）
- 其余 jump 议题统一放在该 section 开头的 mini-list 里（格式同规则 23、但 byline 写「📎 X 件大事（已在前面详写）」）

§5、§6、§7、§8 标准做法（W21 第三轮确立）：
- §5 亚洲：顶部 mini-list 列「2 件大事（PAGCOR 7/31、澳门 5 月 GGR）」+ 下面 2 张本地专属新卡（菲律宾私有化进程、澳门第 2 周数据）
- §6 拉美：顶部 mini-list 列「1 件大事（SPA RS Lei）」+ 下面 3 张本地专属新卡（PL 2.985 5/28、联邦法生效 20 天、赞助降温）
- §7 北美：顶部 mini-list 列「4 件大事（国会调查、第九巡回、SBC Canada、World Cup）」+ 下面 1 张北美专属新卡（Kalshi $22B 估值）
- §8 体博：顶部不放 mini-list、改放 1 张「本周体博五线全景」hilite 聚合卡，用 bullet 列 5 件事 1 行带过 + 综合判断

### 规则 25：每个英文专有名词第一次出现必加中文括注、不要相信「这词业内都懂」

**W21 第一版负面案例**：
- 「9th Circuit」直接写没解释 → Reagan 抓到不知道是什么
- 「Citi」「CLSA」「Seaport」直接写没解释 → 不知道是哪家券商
- 「dump」「noob」夹在中文里 → 直接看不懂
- 「Online Sports」「promo generosity」「market maker」「sportsbook event」「first-time bettors」都是英文残留

**修法**：W19 已列的术语对照表（SKILL.md「英文名词首次出现必加中文说明」段）实际跑 weekly 时严格执行，且新增以下要补的：
- **第九巡回 / Ninth Circuit**：「美国第九巡回上诉法院（联邦层级二审法院、管美国西部 9 州）」
- **Citi**：「花旗集团、美国大型投行」
- **CLSA**：「里昂证券、亚洲赌博板块研究最权威券商之一」
- **Seaport**：「Seaport Research Partners、美国独立研究券商」
- **IAG**：「Inside Asian Gaming、亚太博彩产业主力媒体」
- **MeitY**：「印度电子资讯科技部」
- **ISP**：「网路服务供应商」
- **market maker**：「造市商」
- **Online Sports**：「线上体博」
- **promo generosity**：「派 bonus 太大方」（不要直翻「促销大方度」）
- **first-time bettors**：「首次接触博彩玩家」或「首次下注者」
- **dump**：「倒货」或「把单子接过来后再抛掉」
- **noob**：「（新手）」直接括注、不要保留 noob 这个词
- **sportsbook event**：「体博事件」
- **casino / poker / bingo**：「赌场、扑克、宾果」
- **legal handle**：「合法投注总额」
- **Entain**：「Ladbrokes / Coral / 888 / William Hill 的英国博彩母公司、跟 MGM Resorts 合资经营 BetMGM」

写完前 grep 一次找所有未解释英文 word，看是不是每个都有中文。

### 规则 26：用 `/` 当分隔符在中文里读起来卡、改用顿号「、」

**W21 第一版负面案例**：「美 / 加 / 墨 16 城」「sportsbook + casino + slot」「casino / poker / 线上 bingo」——`/` 在英文 brief 里是精简符号、中文母语读者每次看到都要停顿一下。

**修法**：
- 国家、地区列举：用顿号（如「美、加、墨」）
- 产品品类列举：用顿号（如「赌场、扑克、宾果」）
- 仅 byline、资料标签、URL 这类「视觉标签」场景仍可保留 `·` 或 `/` 分隔

SKILL.md §7.10「不要用斜线 / 当分隔符」规则要严格执行、写完前 grep 找漏网。

### 规则 27：MD 主档不动、所有 user-facing 修正全部在 HTML 端做

**W21 第二、第三轮 Reagan 反馈都是针对 HTML 视觉版**，MD 主档没动也没问题——MD 是版控档 / diff 用、HTML 是给读者看的。

下周起：MD 主档维持「研究报告」格式、HTML 端做最后 polish（包括砍空话卡、改 mini-list、加术语解释、改中英混用）。两份不必字字对齐。

### 规则 28：`<u>综合判断</u>` 在长 `<p>` 段落内嵌时也要前面 `<br>`

**W21 自我验证抓到**：Kalshi $22B 卡的内文段落最后接「<u>综合判断</u>」（不是开新 div.judge、而是同段内嵌）、自我验证脚本 multiline check fail 1/24。

**修法**：长段落内嵌「综合判断」时一定要 `xxx。<br><u>综合判断</u>：...` 格式，前面有 `<br>` 才能通过验证。

下周起：写 .lead 长段、或 .card 内 inline 用综合判断时、记得加 `<br>`。

### 规则 30：docs/index.html 的 EN 副入口要保留、不要按 SKILL.md 旧规则误删

**W21 第三轮负面案例**：Reagan 跑完 prepare-for-github.sh 后、我看到 SKILL.md 写「只放主入口、不放 EN 副入口」就把 W21 的 `<a class="entry-en">` 删了——但 W18 / W19 / W20 实际都保留 EN 副入口、Reagan 在 GitHub Pages 索引页上看到 W21 缺 EN 按钮反过来问「为什么没有 EN」。

**修法**：
- **以现状一致为准、不以 SKILL.md 旧规则为准**：过往三期都有 EN 副入口、就继续保留 EN 副入口
- `prepare-for-github.sh` 自动加的 `<a class="entry-en">` 不要删、留着
- SKILL.md 那条「移除 index.html 內 EN 副入口」指令已经跟实际操作脱节、应作废

下周 W22 起：`prepare-for-github.sh` 跑完后 **不要再手动改 docs/index.html**、保留脚本输出原样。

### 规则 29：跨周重复率检查除了机械标题比对、还要算「同一议题在本周出现几次」

**W21 第一版负面案例**：标题比对显示重复率 0%、但「Kalshi 国会调查」议题在讯号 02 + §1 + §7 一共出现 3 次（外加 §2 Kalish 公关战、§8 jump card）= 实际 5 处提到、读者疲劳来源在此。

**修法**：自我验证脚本除了现有的标题字符串 diff、加一个「核心议题出现次数」检查：
```python
import re
core_topics = ['Kalshi 国会调查', 'Bally\'s Evoke', 'PAGCOR 7/31', '澳门 5 月', 'Brazil SPA']
for topic in core_topics:
    # 用模糊匹配（含关键字组合）算出现次数
    n = sum(1 for sec in sections if topic_in_section(sec, topic))
    if n > 2:  # 1 张完整卡 + 最多 1 个 mini-list 引用
        print(f"⚠️ {topic} 出现 {n} 次、超过红线 2")
```

下周起：写完前跑这检查、单一议题出现 >2 次（1 张完整卡 + 1 个 jump 引用）就回头砍。

---

## 2026-05-17 · 📐 W20 第二轮规则补充（标题 layout / 跨周锚点 / 简体批改 SOP）

### 规则 17：masthead 标题与 lang toggle 必须同水平

**W20 负面案例**：把 lang toggle + pills 放独立 `.lang-toggle-row`，造成标题（Weekly Gambling Brief · W20）跟「中/EN」按钮中间有大段空白、视觉割裂。

**修法**：用 flex 把 masthead 内的 `[标题 + 副标]` 与 `[lang toggle + pills]` 放同一行：
```html
<header class="masthead">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap;">
    <div>
      <div class="kicker">Weekly Gambling Brief · W20 · ...</div>
      <h1>博彩产业视角周报 · 全球博彩产业</h1>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
      <div class="lang-toggle">...</div>
      <div>...pills...</div>
    </div>
  </div>
</header>
```

下周 W21 起所有 weekly 用这个 masthead 结构、不再用独立 `.lang-toggle-row`。

### 规则 18：signal-card 必须加 id、跨 section 「→ 跳回 Signal X」必须真的跳到那张卡

**W18 / W19 负面案例**：所有「→ 跳回 Signal 02」「→ 详见 Signal 04」按钮 href 全部写 `#highlights`、跳回 highlights section 顶部、不是跳到具体那张 signal card。读者要再手动找。

**修法**：
1. 每张 signal card 必须加 `id="sig-01"` 到 `id="sig-05"`（含 lead 那张）
2. 跨 section 跳转按钮 href 改成具体 sig id

```html
<article class="lead" id="sig-01">...</article>
<div class="signal-card" id="sig-02">...</div>

<!-- 跳转按钮 -->
<a class="cta" href="#sig-02">→ 跳回 Signal 02 看完整说明</a>
```

下周 W21 跑 weekly 时直接套这个结构、不能省 id。

### 规则 19：跨期 weekly 简体批改 SOP

历史 weekly（W18 / W19）修复有 30+ 处「內」「週」等繁体字残留——简体强制是 W18 起的规定、但 W18 自身没改完整、W19 也漏。

**修法（强制 SOP）**：
1. 每次跑新 weekly 时、不只检查自身、用以下 Python 脚本批检全部 weekly-*.html 文件：
```python
import re
TRAD_CHARS = '於這體產樂發電關聲繁傳頓頻為個麼馬鳥從點線帶開機們內處動變業樣種場賽週'
for fname in glob.glob('weekly-*.html'):
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    trad_count = sum(c.count(ch) for ch in TRAD_CHARS)
    if trad_count > 0:
        print(f"{fname}: {trad_count} 繁体字残留")
```
2. 发现残留就用 batch replace 修：
```python
repl = {'內': '内', '週': '周', '本週': '本周', ...}
for old, new in repl.items():
    c = c.replace(old, new)
```
3. 修完 cp 到 docs/ 同步

### 规则 20：来源覆盖列表 audit 必须每周做

W20 负面案例：列了 Bloomberg ✓ 但全文删掉 Bloomberg link、对账失败。

修法：weekly 跑完前用 grep 对账每个来源是否真有 link：
```bash
# 列表上每个来源都要 grep 一次、确认有 href 存在
for src in "Bloomberg" "CNBC" "Yogonet" ...; do
  count=$(grep -c "$src" weekly-*.html)
  echo "$src: $count"
done
```
列表上有 ✓ 但实际无 link → 移除或补回 link。

---

## 2026-05-17 · 📐 W20 大改版规则（顾问视角重写 — 强制规则、下周起执行）

**Reagan 校稿后累积的核心规则**，每条都是 W20 第一版犯过、必须改的。下周 weekly 跑产之前必读。

### 规则 1：头条砍到 4 个（不是 5）+ 不放区域性新闻

- 头条主题 = 4 个最重要主题、每个主题对应 1 张 signal card
- 区域性新闻（澳门、菲律宾、巴西特定动态）**不上头条**、回归对应区域 section
- 头条 card 是「摘要 + 顾问判断」、不是详细新闻流水帐
- W20 负面案例：第一版把澳门税收 + Mario Ho 放头条、被指「不需要、应回归亚洲 section」

### 规则 2：删除 §0 trigger 回顾（HTML 端）

- §0 是内部用、不放在对外 HTML
- md 主档可以保留（内部 ops 用），但 HTML 不显示
- W20 负面案例：第一版把 §0 当独立 section 放在 HTML

### 规则 3：跨段去重 — 头条已提的内容、section 不重复

- 头条已经讲过的新闻、section 里**直接不写**（不是「详见 Signal X」、而是真的不放）
- section 内容只放头条没提的「补充资料」或「不同角度切入」
- 章节本身可以变薄（甚至只有 1-2 张 card）、不需要为了凑数而重复
- W20 负面案例：AGA / DKNG Combos / Bally's Evoke 在头条与 §1 / §2 / §3 / §4 各重复 1-3 次

### 规则 4：无新进展的卡片 — 直接删，不放「持续追踪」卡

- 「本周无新进展」的 card → 直接删除，不放在 HTML
- 这种 card 让读者觉得在看上周内容、降低 brief 价值感
- W20 负面案例：bet365 卖身、Kalshi $22B、Sportradar Playradar、AWS outage、CMN 5.298 等 5+ 张「无新进展」card

### 规则 5：consultant 顾问口吻 — 这些用语全部禁用

| 禁用 | 改用 |
|---|---|
| 「白话讲」「白话说」 | 直接讲、不需要加这个引导词 |
| 「我们讲」「我们判断」 | 「市场观察」「业界共识」「顾问综合判断」 |
| 「对接案」「对接 X 案子」 | 「对 X 市场的项目」「对 X 客户」 |
| 「brief」 | 「项目」「营销方案」「项目脚本」 |
| 「+EV / -EV」 | 「利好 / 不利」「+EV / -EV」改用「对 X 利好 / 不利」 |
| 「marketing 直接吃量」 | 「直接耗用营销预算」 |
| 「marketing expenses」 | 「营销费用」 |
| 「nearshore」 | 「邻近市场」 |
| 「sportsbook 化」 | 「体育博彩化」（解释清楚） |
| 「memo 把数字写死」 | 「正式公告」「memo 写明 X」 |
| 「battle」「battlefield」 | 「战场」「战局」（中文版用中文） |
| 「pitch」「play」 | 「论述」「策略」「打法」 |

### 规则 6：英文名词全部要中文注释（首次出现）+ 减少中英混杂

每个英文术语首次出现都加中文括号。例如：
- DraftKings → DraftKings（美国体博龙头之一）
- PAGCOR → PAGCOR（菲律宾博彩监管局）
- AGA → 美国博彩协会（AGA）
- cashback → 现金回扣
- rebate → 返水（或返利）
- parlay → 多注合并 / 组合下注
- preempt → 优先适用、取代
- GGR (gross gaming revenue) → 毛博彩收入
- valuation benchmark → 估值基准
- market-making → 庄家做市
- futures commission merchant (FCM) → 期货经纪商
- 「positive and necessary」 → 「正面且必要」（业界专家评语）

不要中英两边交错堆出来、要么说中文、要么说英文（搭一次中文注释）

### 规则 7：人名 — Mario Ho → 何猷君（中文 + 身份注记）

- 中文 HTML 内出现人名一律先写中文
- 简短身份注记：何猷君（1995 年生、已故澳门赌王何鸿燊之子、母亲梁安琪为 SJM Holdings 联合主席、本人为美国职篮波士顿凯尔特人队共同持有人）
- 同类：Stanley Ho → 何鸿燊 / Angela Leong → 梁安琪 / Lula → Lula 总统（或巴西总统 Lula）

### 规则 8：新闻来源格式 — 改成清单分行、不用「阅读原文」按钮

- 不要用「阅读原文 →」（单一连结、不知道是哪家媒体）
- 改成「新闻来源」清单 + 每条媒体名 + 文章题目 + 连结
- 多个来源用 `<ul>` 清单分行、不用 `/` 分隔

格式范例：
```html
<div class="news-sources">
  <div class="label">新闻来源</div>
  <ul>
    <li><a href="...">Yogonet — AGA Q1 报告</a></li>
    <li><a href="...">SBC Americas — AGA 报告解读</a></li>
  </ul>
</div>
```

### 规则 9：跑版修正 — 用 .grid-auto，让单卡自动占满

- 之前问题：section 只有 1 张 card 时、`.grid-3` 让卡左对齐、右侧 2/3 空白
- 修法：用 `grid-template-columns: repeat(auto-fit, minmax(340px, 1fr))`
- 单卡时自动占满整列、不留白
- 多卡时自动平分

### 规则 10：顾问综合判断 — 必须涵盖五个要素

每张 card 的 `<u>顾问综合判断</u>` 段必须涵盖：
1. **看到的未来**（这则新闻预示什么趋势）
2. **看到的商机**（哪里有机会）
3. **切入点**（具体怎么操作 / 哪里下手）
4. **对运营市场的影响**（菲律宾、巴西、北美的具体影响）
5. **建议**（顾问角度的具体行动建议）

不必每点都用粗体标出来、但段落里要 implicit 涵盖。

### 规则 11：next-list（下周关注）必须每条单行、可换行不超 2 行

- 节标题 + 简短说明、分行清楚
- 同一条目超过 1 行就换段
- W20 负面案例：第一版 next-list 每条挤一行、内容过长会换行 2-3 次，排版散乱

### 规则 12：标题缩短

- §0 → 删除
- §9 X Pulse → 「X 社交脉动」或「§9 X」
- §10 动作建议 → 「下周建议关注」

### 规则 13：「本周触发讯号回顾」全段删除

- 内部 ops 段、对外不放
- md 主档保留即可

### 规则 14：EV 用语 — 改为「利好 / 不利」

- 头部 pills 改成「＋利好」「○中立」「−不利」（不写「正面 / 负面」）
- 内文 +EV / -EV 一律改成「对 X 利好 / 对 X 不利」
- EV 是金融术语、博彩业内非通用、避免使用

### 规则 16：事实校正与严谨度（W20 校稿后强制规则）

W20 校稿过程暴露五种顾问材料常见但致命的「事实精度」问题。下周 W21 起所有 weekly 必须自检以下：

**16.1 人名身份描述不可过度强势**
- 「共同持有人」「主要股东」「联合创办人」这类语义都暗示 controlling position
- 写之前必查实际持股结构。如：何猷君是 Boston Celtics 收购案的「少数股权投资人 minority investor」、不是「共同持有人 co-owner」
- 不确定就拿掉身份注记、不影响论述就行

**16.2 数据因果不可错位**
- 「绝对增量 X 人」+「年减率 Y%」是不同单位、不能直接推论「人群不重叠」
- W20 负面案例：Yogonet 写 Kalshi 增 630 万 + sportsbook 装机减 13-18% → 顾问材料原稿直接推「不是同一群人」，但单位错位
- 修法：引用数据后加 hedge 段「需注意 X 是绝对值、Y 是变化率、严格论证需 panel data」

**16.3 流动性 / 估值类比要给比例感**
- 「Kalshi $27B 周成交 = 金融市场级流动性」错——CME $1,200B、CBOE $600B、Kalshi 只是 CME 的 2-3%
- 类比时必须计算比例、不要光丢绝对数字
- 写「已脱离博彩边缘地位、但远未达主流金融市场流动性」比写「金融市场级」严谨

**16.4 同卡多个数据范围必须明确分隔**
- 一张卡同时出现「全球 $21B」+「美国版 $5M」差 420 倍、读者会以为是同池
- 修法：用副标 / 项目符号清楚分隔「全球数据」vs「美国市场数据」、不要混在同一段

**16.5 样本量要标注**
- 「81% 业界高管视 X 为重大威胁」没标 n=26 = 读者会以为大样本调查
- 任何百分比 / 比例数据必须标注样本量（n=N）
- 小样本调查（n < 100）要明确 hedge：「具方向性参考价值、不应当作大样本统计结论引用」

**16.6 事件 stage 不可篤定 / 不可滞后**
- 「确定有人接盘」「准备 5 月中发布」这种描述会被时序变化打脸
- W20 负面案例：(1) Bally's × Evoke 写「确定有人接盘」、实际上 5/18 只是公告 firm offer 或 walk away 的 deadline、不等于已成交；(2) Brazil Lula 总统令写「拟于 5 月中发布」、实际上 MP 1.355 已 5/4 签署、Portaria 1.237 + IN 3 已 5/5 发布、已进入执行期
- 修法：(1) 用 stage-aware 用语（「程序节点」「公告期限」「执行期」、不用「确定」「即将」）；(2) 每周跑 weekly 前对所有 W{N-1} 提到的「未来时间点」实地查证当前 stage

**16.7 因果关系不可单一归咎**
- 「英国 RGD 翻倍 → 实体投注店关 270 家」错——RGD 是 remote gaming duty、不是 retail shop duty
- 修法：用「税务 + 利润率压力 + 实体重整三线叠加」、不要单因果归咎单一变量

**16.8 法规 / 协会名称首次出现必加官方原档 link**
- 「AGA Q1 Outlook 报告」必附 AGA 官方页面（不是猜的 URL）
- 「巴西 MP 1.355」必附 Brazil Ministério da Fazenda 立法页面
- 「UK RGD」必附 GOV.UK 页面
- 找不到真实 URL → 不挂连结、不要凭路径猜（参照规则 15）

**16.9 来源覆盖列表只列真正引用过的媒体**
- 列了 ✓ 但全文没有 link = 假装引用
- 每周 weekly 跑完前 audit：来源覆盖列表 vs 文章内 link 数量对账
- W20 负面案例：列了 Bloomberg ✓ 但 HTML 删掉 BNP 那条 link 后没同步移除

---

### 规则 15：所有 URL 必须实地验证（W20 负面案例）

**事件**：W20 我口头给的 AGA 官方 link `americangaming.org/research/aga-gaming-industry-outlook/` 实际是 404 / 「No dice!」错误页、是我凭直觉猜的 URL pattern。

**根本问题**：以「网站常见路径」推断 URL = 等于编造来源，对客户给的 brief 是致命的信用问题。

**强制修法**：
- 任何写进 brief 或回复给 Reagan 的 URL、必须先用 WebSearch 或 WebFetch 实地确认存在
- AGA 等监管 / 协会官方报告的 URL 不能从经验「合理推断」、必须 search 取得真实 link
- 媒体连结即使在 _sources.md canonical 列表里、文章层级 URL 仍要逐条验证
- 找不到真实 URL → 不挂连结、不要瞎猜（参考 W19 规则）

**AGA Q1 2026 报告正确连结**（W20 已确认）：
- 资源页：https://www.americangaming.org/resources/gaming-industry-outlook/
- 官方新闻稿：https://www.americangaming.org/gaming-executives-remain-optimistic-as-industry-growth-continues-sports-event-contracts-drive-rising-industry-concern/

---

## 2026-05-10 · 📐 weekly 產出位置改為 docs/（GitHub Pages 直接根目錄）

**Reagan 指示**：「以後要產出到這個目錄：`/Users/cw/文件/Claude/cowork/daily-brief/docs`」

**修法**：
- weekly 產製流程的「最終存放位置」從 `/daily-brief/`（根目錄）改為 `/daily-brief/docs/`
- `prepare-for-github.sh` 跑完後、最後 cp 到 docs/ 這步要做掉
- 命名：CN 用 `2026-Wxx.html`，EN 用 `2026-Wxx-en.html`
- index.html 也直接放 docs/，只留主入口（W18 / W19...），**不放 EN 副入口**——EN 透過 weekly 內 toggle 進

**注意 publish.py 的 bug**：`scripts/deploy.sh` 內部呼叫的 `publish.py` 用 `weekly-*.html` glob 抓檔，CN/EN 都被抓但都映射到 `2026-W19.html`——EN 會蓋 CN。**手動 cp 比較穩**，或修 publish.py 加 `-en` 偵測。

---

## 2026-05-10 · 📐 W19 weekly 三輪 feedback 累積規則（Reagan 校稿）

W19 weekly 跑完後 Reagan 三輪 feedback 改完，累積以下新規則。**全部已寫進 `_skill-md-proposed-2026-05-10.md` v2，待 Reagan 貼回 weekly-gambling-brief 的 task 設定。**

### 規則 1：重複新聞處理 SOP（最重要）

**症狀**：W19 第一版把 W18 已寫過的議題（F1 × FanDuel、NBA Damon Jones、Amusnet × 747Live、BetConstruct AI Malta、RS Lei 16,508 完整 law-box）當主卡再放一次。Reagan 第三輪抓到「我在 W19 中也看到多種新聞重覆讀到的感覺」。

**修法**：上週 W{N-1} weekly 已寫過 + 本週**無新進展**的議題，**只能在最相關的 1 個 section 出現一次「持續追蹤」卡**。
- byline 標「W{N-1} 持續追蹤」
- 短摘要 1-2 句（無新進展、判斷維持）
- cta 連**原始新聞 URL**，不是上週 weekly 頁面
- 不能在 §1、§3、§5 同時放同議題的引用卡

### 規則 2：連結原則（W19 新規則）

「持續追蹤」卡的 cta **一律連原始新聞 URL**（iGaming Brazil / Gambling Insider / EEGaming 等媒體原文），**不要連到上週 weekly 頁面**（如 `./weekly-2026-05-03.html#s6`）——對讀者沒意義、舊 weekly 對外不一定公開。byline 或內文可以寫「W18 已完整報」標明歷史脈絡，但 cta 必須是原文。

**負面案例**：W19 第二輪修法時 cta 用了 `./weekly-2026-05-03.html#s8`、`./weekly-2026-05-03.html#s6`，第三輪被 Reagan 抓到。

### 規則 3：內部 ops 訊息一律不寫前端

禁止寫前端：fallback 情況（「腳本未部署、改用 WebSearch fallback」）、query 候選（「下週建議 query：apostas Brasil」）、成本（「本週 grok 成本」）、技術錯誤（「API 回 410 deprecated」）、腳本未部署狀態。這些放內部 lessons-learned / scheduled task log。

**負面案例**：W19 第一版 §9 X Pulse 段開頭塞了「本任務的 grok_x_search.py 自動腳本未在當前環境部署成功⋯」整段內部 ops 訊息，第二輪被 Reagan 抓到。

### 規則 4：看不懂的綜合判斷段——禁止抽象比喻、改具體因果鏈

黑名單（在 _design-notes.md §7.7 + W19 累積擴充）：「術語遮蔽」「故事線的另一面」「結構性轉向」「這週交答」「就要重劃」「雙殺期」全部禁。

改寫範例：
- ❌「為什麼降溫」→ ✅「W18 我們判斷 5-7 月會疲弱、這週黃金週數據比預估硬 15-20%、所以原本的負面預期降級」
- ❌「為什麼是窗口」→ ✅「5/13 業內派對會洩露下季合作信號、5/12-14 G2E Asia 簽約動作能看後續走向」
- ❌「對 sportsbook 反攻 PMs 的『術語遮蔽』論述提供新工具」→ ✅「連『derivatives trading 是金融衍生品、不是賭博』這種術語區分都正在被立法者重新審視」

### 規則 5：長標題避免換行

標題若多兩個字會換到下一行就要修整。範例：
- ❌「巴西 CMN 5.298 法令 5/4 上路第一周 + Lula 政治打擊升級 + SPA 第一波 KYC 罰單已下」（會換行）
- ✅「巴西 CMN 5.298 法令上路 + Lula 政治升級 + 第一波 KYC 罰單已下」

### 規則 6：訊號 1 lead 內的綜合判斷不要分太多段

lead 預設 1 段「綜合判斷」、不要拆 3 段（會看起來散）。多重對象（對 NA / 對菲 / 對巴）用「對 X⋯。對 Y⋯」串在同一段、用句號斷句而非分段。

**負面案例**：W19 第一版訊號 1 把「對接北美 / 對菲律宾巴西 / +EV 結論」拆成 3 個 `<p>`，第三輪 Reagan 說「這段不用斷行」。

### 規則 7：signal-card cta 字級對齊（技術性）

`_design-notes.md` CSS 中 `.lead .cta` 是黑底白字 button、`.card a.cta` 是 11px underline、**`.signal-card` 沒定義 cta 樣式**——訊號 02-05 內的 cta 會繼承 `.signal-card p` 的 12.5px、跟內文一樣大。

修法：signal-card 內所有 cta 加 inline style 對齊 .card 樣式（11px underline）；訊號 01 lead 內的 cta 不動（保留 button 樣式）。

### 規則 8：`<br><br>` 不用、單個 `<br>` 就夠

W19 第一版我把所有 `<u>綜合判斷</u>` 前加 `<br><br>`，整份排版拉長了。Reagan 說「上一版的排版好看多了」、要求恢復緊湊感。修法：單個 `<br>` 就夠、不要 `<br><br>`。

### 規則 9：名詞解釋首次出現必補中文括號（W19 累積擴充）

W19 新增解釋表：MGF / EGLD / B2B Accreditation / SGP / in-play / Series F / 雙 beat / LSE / derivatives trading / market-making / VIP / premium mass / base mass / EC2 / EBS / SLA / uptime / multi-cloud / region-redundant / low millions of reais / PAGCOR 雙重身份 / Bally's Intralot / Evoke / Mansour / Robins / SCOTUS。完整表在 `_skill-md-proposed-2026-05-10.md` 規則段 §「專有名詞 / 英文縮寫第一次出現必加中文說明」。

---

## 2026-05-10 · ⚠️ SKILL.md 自我驗證段 vs W18 canonical 設計 mismatch

**症狀**：W19 weekly（5/10）由排程跑時，SKILL.md「自我驗證」段的 grep 規則整套對不上實際產出——

- `num-box">01<` ~ `08<` 各 0 處（新設計沒有 num-box，section 走 `<h2>` + cat tag）
- `<u>綜合判斷</u>` html 端只 15（SKILL.md 期望 ≥25）——不是少寫，是 News Clipping 的 col-card 結構把判斷收斂成更短形式
- `<article>` 開關各 1（舊報紙樣式 3 個 article，新設計只 1 個容器）
- `8.1 BRAZIL / 8.2 NORTH AMERICA` 0 matches（X Pulse 在新結構是 §9、且 sub-section 標題格式不同）
- `callout-trigger` 0 matches（§0 trigger 回顧段在 News Clipping 設計裡沒落地）

**根因**：SKILL.md「自我驗證」段是 W17 報紙樣式時代寫的，2026-05-03 切到 News Clipping wireframe（見本檔 5/3 條目）後，README.md 已標註「**SKILL.md 舊『逐 section 替換』指令已過時**」並把規格丟給 `_design-notes.md`，但**自我驗證 grep 規則沒同步搬家**——下游 weekly 跑完看似失敗、實際是驗證腳本對著舊規格打。

**判斷**：這是 SOP 根性 bug，不修下次排程跑的人（含 AI 助手）會誤判 brief 是半成品、可能觸發不必要的覆蓋重產（−EV）。

**修法**（待跑）：
1. ⚠️ SKILL.md「自我驗證（產完強制跑）」整段重寫，grep 規則改參照 `_design-notes.md` 的 11-section News Clipping 結構（cat tag count / sentiment pill count / col-card count / hi 黃底 callout count / §9 X Pulse markers）
2. ⚠️ §0 trigger 回顧段：要嘛在 News Clipping 設計裡正式落地一個視覺塊（建議：新增 cat tag = `TRIGGER REVIEW` 的 col-card row），要嘛從 SKILL.md 整段移除——目前狀態是「SKILL.md 寫了但設計沒做」，最差
3. ⚠️ 修完跑一次 dry-run 驗證 W18 / W19 兩份 baseline 都過

**負面案例**（5/10 自身）：
- 06:08 的早班產出已是 News Clipping canonical 結構、品質完整
- 09:00 排程觸發時、AI 助手看 SKILL.md 驗證段全失敗、差點覆蓋重產——靠 README.md 那行「SKILL.md 舊指令已過時」攔住、改報「沒料就不重跑」
- 這次靠 README 註記攔下、下次可能攔不住

---

## 2026-05-04 · 📐 對外發佈系統上線：GitHub Pages + docs/

**對外客戶看 brief 的固定網址**：https://casillaswu.github.io/daily-brief/

### 架構
- **公開** repo：`Casillaswu/daily-brief`
- **內部 IP 全部 gitignore**：`_*.md` / `lessons-learned.md` / `snapshots/` / `weekly-*.md` / `_template.html` / `scripts/` / 原 `README.md` 都不上 git
- **只發佈 `docs/`**（GitHub Pages 硬規則：只能用 `/(root)` 或 `/docs`，不接受自訂名）
- 所有 docs/ 內 HTML 自動注入 `<meta name="robots" content="noindex,nofollow,noarchive">`

### 工具
- `scripts/publish.py` — 掃 `weekly-*.html` → 複製到 `docs/{ISO-week}.html` + 注入 noindex + 生成目錄頁
- `scripts/deploy.sh` — 一鍵 build + commit + push（自動處理 stale lock / master→main / 首次 -u）
- `_publish-guide.md` — 完整操作手冊 + 排雷表

### AI 助手規則（重要）
**每次幫 Reagan 產完 weekly brief（.md 或 .html 任一），結尾必須主動提醒**：
```
記得跑：
cd ~/文件/Claude/cowork/daily-brief && ./scripts/deploy.sh
客戶網址：https://casillaswu.github.io/daily-brief/
```
不要等他問，不要省略。已寫進 `README.md` AI 助手提醒規則區塊。

### 排雷紀錄
- GitHub Pages 「Deploy from a branch」**只支援 root 或 /docs**——不要再嘗試 `public/` 或其他名稱
- 沙箱 `git init` 會留 `.git/index.lock` 死檔——deploy.sh 已加自動清理
- 首次 push 必須 `-u origin main`——deploy.sh 已自動偵測無 upstream 補帶
- HTTPS 密碼認證自 2021 已禁用——強制 `gh auth login` 或 PAT
- Mac git 預設可能還是 `master`——deploy.sh 自動 rename `main`

---

## 2026-05-04 · ⚠️ 運營商 URL 必驗證 — Phishing / Lookalike 防呆

### 為什麼

PAGCOR / SPA 持照運營商常被 phishing 站仿冒。一個常見例子：搜「747Live」會跑出 `747live.pro`、`747lives.net`、`747livebetting.com`、`one747live.net`、`747.live`、`747ph.live` 等一大堆近似域名——其中只有一個是真的、其他全是釣魚站或聯盟仿站。

如果沒驗證就寫進 brief：
- 客戶 / 讀者點到山寨站、影響 brief 信譽（也可能傷到 Reagan 個人聲譽）
- 山寨站的 SSL、UI 跟正規站幾乎一樣、肉眼不一定分得出
- PAGCOR / SPA 的合規執法可能會把寫錯 URL 的內容認定為「協助非法營運」

### 規則：URL 寫進 brief 之前必跑兩步

1. **對照表先查**：本檔下方「PH 持照運營商 canonical URL 對照表」
2. **沒在表上的**：跑 web_fetch 確認 200 OK + 頁面跟運營商 PR / 法規公告一致 + WHOIS 註冊資訊與品牌方對得上 → 才能寫進 brief、且回頭更新表

URL 在 brief 裡一律用 `[品牌名](URL)` markdown link、不要寫裸 URL。

### PH PAGCOR 持照運營商 canonical URL 對照表

> ✓ = 已驗證、可以引用 ｜ ⚠️ = 待驗證、引用前要先 web_fetch

#### 線上 B2C / iGaming

| 品牌 | Canonical URL | 狀態 | 備註 |
|---|---|---|---|
| **ArenaPlus** | `https://arenaplus.ph/` | ✓ Reagan 5/4 確認 | Solar Sports 旗下、體博 + iGaming |
| **747Live** | `https://www.747.live/` | ✓ Reagan 5/4 確認 | Amusnet 4/28 合作對象；其他 `747live.pro` / `747lives.net` / `747livebetting.com` / `one747live.net` / `747ph.live` 全是仿站、不要引 |

#### 實體 IR / 大型 casino resort

| 品牌 | Canonical URL | 狀態 | 備註 |
|---|---|---|---|
| **Solaire Resort** | `https://www.solaireresort.com/` | ✓ Reagan 5/4 確認 | Bloomberry Resorts 旗下、馬尼拉灣區 |
| **Okada Manila** | `https://www.okadamanila.com/` | ✓ Reagan 5/4 確認 | Tiger Resort 旗下、Entertainment City |
| **City of Dreams Manila** | `https://www.cityofdreamsmanila.com/` | ✓ Reagan 5/4 確認 | Melco Resorts 旗下 |
| **Newport World Resorts** | `https://www.newportworldresorts.com/` | ✓ Reagan 5/4 確認 | 原 Resorts World Manila、Travellers International（Megaworld + Genting JV） |
| **Hann Casino Resort** | `https://www.hanncasinoresort.com/` | ✓ Reagan 5/4 確認 | 克拉克區、原 Widus |
| **Casino Filipino** | `https://www.casinofilipino.ph/` | ✓ Reagan 5/4 確認 | PAGCOR 自營連鎖、2028 前私營化計畫進行中 |

#### 觀察中（暫無 / 開發中）

| 品牌 | URL | 狀態 | 備註 |
|---|---|---|---|
| Solaire Resort North（奎松市） | 暫無 | ⚠️ 待確認 | Bloomberry Resorts 旗下、2024 開幕 — Reagan 5/4 表示尚未確認、建議標暫無 |
| Westside City Naga | 暫無 | — | Megaworld 預定 IR、施工中 |

#### 監管 / 政府

| 機關 | Canonical URL | 狀態 | 備註 |
|---|---|---|---|
| **PAGCOR 官網** | `https://www.pagcor.ph/` | ✓ Reagan 5/4 確認 | 主站；EGLD 名單 / 認證公告 / 罰單列表第一手來源 |
| **PAGCOR 新聞頁** | `https://www.pagcor.ph/news-archive.php` | ✓ Reagan 5/4 確認 | **修正**：之前 `_sources.md` 寫的 `news.php` 是錯的（404）。正確是 `news-archive.php`。 |

### Phishing 紅旗（看到這些先停下）

- **域名後綴跟正規不同**：合規 PH 站通常用 `.ph` 或 `.com`、釣魚站愛用 `.pro` / `.net` / `.app` / `.live` / `.bet`
- **TLS 證書是 Let's Encrypt 短期換的**：合規大廠通常用 DigiCert / Sectigo 等長期憑證
- **頁面 banner 寫「100 % 中獎」「無需 KYC」「立即提款」**：合規站不會這樣寫
- **域名包含視覺相似字**：0 / O、l / 1、h / k、cn / ch 互換
- **WHOIS 註冊不到 1 年 + 隱藏註冊人**：合規 PAGCOR 持照站通常有公開法人資訊

### 維護規則

- 每次 brief 寫到新運營商品牌時、**先查本對照表**
- 表上沒有的：加 `⚠️ 待驗證`、跑直連、回頭把表更新成 ✓
- 對照表狀態 `⚠️ 待驗證` 的：下週 W19 weekly 跑 SOP step 1 時、優先 web_fetch 驗證一輪
- 客戶 brief 提到品牌時、**對應 URL 要當條件式必填**（沒驗就不寫品牌名、不寫 URL）

---

## 2026-05-04 · 📐 語言切換：繁體中文 → 簡體中文

**自 W18（2026-05-03）起，weekly 一律以簡體中文輸出。**

### 為什麼

Reagan 的目標讀者群（含未來上 GitHub 給夥伴 / 客戶看）以簡體閱讀者為主。繁體版的 W18 已轉換覆蓋為簡體版（不保留繁體 backup）。

### 規則

- `_design-notes.md` 第 1 節已更新字體 stack（PingFang SC 優先）
- 下週 W19 跑 weekly 時直接寫簡體、不要先寫繁體再轉（避免混合狀態 / 字符對照不全的問題）
- 技術術語、品牌名、行業縮寫（ROI / +EV / sportsbook / GGR / handle / DraftKings / bet365 / Polymarket）一律保留原樣
- 連帶幾個習慣寫法切換：訊息 → 信息、行銷 → 营销、資訊 → 信息、軟體 → 软件、視訊 → 视频、影片 → 视频、網路 → 网络

### 工具備忘

sandbox 沒有 OpenCC / zhconv 等套件、用內建字符對照表轉了 3 輪才到 99 % 覆蓋。下次直接寫簡體最省事。

如果 W18 版上線後發現殘留繁體字，補進 `_design-notes.md` §7 的字符對照表、下週統一處理。

---

## 2026-05-03 · 📐 Snapshot + Week-over-Week Diff 制度上線

**從 W19（2026-05-10）起，每週 weekly 產完後強制跑 diff，比較前一週 vs 本週的競品變動。**

### 為什麼

讀兩份 weekly 對比，**人腦容易抓主軸（已經高亮的）但漏掉次要變動**——行業真正的 alpha 通常藏在「上週還在觀察、本週已進場」「某 CEO 悄悄改了 take」這類 weak signal 裡。要靠機械式比對才不會被主軸蓋掉。

### 結構

- `snapshots/YYYY-Www/` — 每週 weekly 產完後 cp 進去（baseline + html）
- `snapshots/YYYY-Www/diff-W{prev}-to-W{this}.md` — diff 報告（W19 起首次產出）
- 規則 / prompt 模板 / checklist 全在 `_diff-rules.md`
- W18（2026-05-03）為首期 baseline，已 snapshot

### 6 類偵測

(1) 定價更新 / (2) 新層級 / (3) 移除的功能 / (4) 定位轉變 / (5) 訊號優先序變化 / (6) 法規進度推進

詳見 `_diff-rules.md` 第 2 節。

### 操作流程

`_sources.md` SOP 第 8 步已寫入；下週日 weekly 產完後自動觸發。

---

## 2026-05-03 · 📐 Weekly HTML 設計切換：報紙樣式 → News Clipping wireframe

**從 W18（2026-05-03）起，weekly-*.html 一律改用 News Clipping wireframe 風格設計。**

### 為什麼切

- 舊報紙樣式（VOL.01 / 三頁 article / promo strip / hero / cols-3）資訊密度雖高但結構僵硬，不利掃描
- News Clipping wireframe 的 cat tag + sentiment pill + hi 黃底 + col-card grid 更適合「快速掃描 + 訊號優先級判讀」
- Reagan 偏好「結論先講、行動最後」——新設計每張 col-card 都自帶 `<u>綜合判斷</u>` 段，符合此邏輯

### SKILL.md 舊「逐 section 替換」指令已過時

下面這些舊指令是給「報紙樣式 _template.html」用的，**新設計不適用**，下次跑請忽略：
- ~~corner-mark → 「VOL.01 / WEEKLY · W週數」~~
- ~~logo h1 → 「Weekly<span class="accent">Deep</span>」~~
- ~~masthead-meta → 「Week 週數 · DD MMM – DD MMM YYYY」~~
- ~~promo strip 3 個格子~~
- ~~lede headline + hero 3 個 signal blocks~~
- ~~cols-2 hilite 雙卡~~
- ~~§1-§7 各 section（cols-3 或 cols-2 col-card）~~

### 新設計規格在 `_design-notes.md`

下次跑 weekly 時：
1. 複製最新一份 `weekly-*.html` 為基底（仍是 News Clipping 風格，因為 5/3 已切）
2. **不要照 SKILL.md step 4 的舊「逐 section 替換」指令做**
3. 改照 `_design-notes.md` 的「替換規則」逐 section 套新內容
4. 自我驗證 checklist 也在 `_design-notes.md`

舊報紙樣式版本封存為 `weekly-2026-05-03-newspaper.html`，未來不再使用，僅供對照。

---

## 2026-05-03 · ✅ 漏抓 Amusnet × 747Live PAGCOR 案 → Tier 2 補三站

**症狀**：W18 weekly 5/2 版本漏報 4/28 Amusnet 取得 PAGCOR EGLD 核准、透過 747Live 上線 214 款遊戲——B2B Accreditation 4/1 死線後第一波白名單實際變動可見案例。

**根因**：
1. 首發站 EEGaming + Gaming Intelligence **不在 `_sources.md` Tier 1 / Tier 2 池**——平行抓站時根本沒撈到
2. WebSearch query 集中在「PAGCOR 監管 / 廣告 / 嚴管」，**沒跑「PAGCOR EGLD-approved / new accreditation / supplier launch」這種正向操作面 query**
3. B2B Accreditation 議題只看了「政策面」、沒看「執行面結果」

**修法**：
1. ✅ `_sources.md` Tier 2 從 8 站升 11 站（加 EEGaming / Gaming Intelligence / SIGMA World）
2. ✅ SOP 加「執行面驗證 query」（PAGCOR EGLD / SPA license / DICJ junket 三市場各一條）
3. ✅ B2B Accreditation 執行驗證 checklist（每週查 PAGCOR EGLD 名單變動）
4. ⚠️ Allowlist 補強——使用者已嘗試 add EEGaming / Gaming Intelligence / SIGMA / pagcor.ph apex，但 5/3 16:00 測試仍未生效，待重啟 cowork 後重測

**衍生發現**：
- `_sources.md` 寫的 PAGCOR canonical URL `https://pagcor.ph/news.php` 是壞的（404）——這個是 SOP 根性 bug，下次 weekly 跑前要找正確新聞頁路徑（candidate：`/announcements` / `/press-release` / `/media-center`）

---

## 2026-05-03 · 📐 Tier 2 三站策略

新加的三站定位：

| 站 | 定位 | 抓什麼 |
|---|---|---|
| EEGaming | B2B 供應商動態 + 區域擴張公告 | Amusnet / Pragmatic / Evolution / SOFTSWISS 等 supplier 進新市場 / 拿新 license / 新合作 |
| Gaming Intelligence | 供應商 / 法規綜合 | 跟 EEGaming 互補；偏向「整篇深度報導 + 法規分析」 |
| SIGMA World | B2B 框架解析、認證制度 | PAGCOR / SPA / MGA accreditation 制度的「制度面」報導 |

**抓法**：跟 Tier 1 同等對待平行抓 canonical URL；filter 條件加上「執行面 keyword」（accredited / approved / live with / launches in）。

---

## 排雷紀錄（持續更新）

- **2026-05-01** Apex → www 永久 301（web_fetch 不跟 redirect）：bloomberg / ggrasia / reuters 必須用 `www.` 前綴
- **2026-05-01** robots.txt 200 ≠ 可爬：igamingbusiness / bloomberg 對 ClaudeBot / anthropic-ai 全站 Disallow，走 RSS only 或不當原文來源
- **2026-05-02** 缺前日 diff 直接寫 = 重複登頂訊號。**寧可多花 30 秒讀上週 weekly + 過去 7 天 daily，也不要憑記憶起手寫**
- **2026-05-02** API 串流逾時：對 HTML 大檔做超過 8-10 連續大改動會撞 stream timeout。對策：每 5-6 個 Edit 為一輪，輪間用簡短訊息切片
- **2026-05-03** 漏抓 Amusnet × 747Live → Tier 2 補三站 + 加執行面驗證 query（詳見上方）
- **2026-05-03** PAGCOR canonical URL `pagcor.ph/news.php` 404，SOP 根性 bug，待修

---

**最後更新**：2026-05-10

## 2026-06-07 · W23 跑批：grok openai→urllib 修好 + PH promo「不可达」是误判

### 1. grok_x_search.py：openai SDK → urllib（已修、实测通过）
- **根因**：排程沙箱装不了 openai（`pip install` 无 PyPI 出口、回 No matching distribution）。但 `api.x.ai` 本身可达（urllib 打 root 回 421、不是 tunnel 403 = 连得到）。
- **修法**：把 `client.responses.create(...)` 那层换成 `urllib` 直打 `POST https://api.x.ai/v1/responses`（body: model + input + tools[{type:x_search}]）、raw dict 解析 `output[].content[].output_text` + annotations url_citation。query 清单原封不动。REQUEST_TIMEOUT=180（x_search 是 agentic、跑久）。
- **实测**：`python3 scripts/grok_x_search.py weekly na` 回真·in-window X 贴文（@WALLACHLEGAL 等、真 x.com URL）。下周 W24 §9 可恢复真 X 数据、不用再 WebSearch fallback。
- **成本**：单市场 grok-4-fast ≈ $0.3。

### 2. PH promo「沙箱连不到」是误判——分清两条网路路径
- **错在哪**：W23 我看 `ph_promo_snapshot.py` 跑出来 7 站全 tunnel 403、就下结论「沙箱连不到这些站」。错。
- **真相**：脚本用 **bash 沙箱内的 urllib**、走的是「egress 代理」、那条路对 consumer 博彩域名 + `api.firecrawl.dev` 都 403（白名单制）。但 **`web_fetch` MCP 工具走另一条路**、实测能抓到 okbet.com（回完整 page）。两条路不一样、不能用脚本失败推断「网路不可达」。
- **但还有第二层**：okbet 等是 client-rendered SPA、`web_fetch` 只拿到 meta 壳、promo 数字（cashback/rebate %）是 JS 渲染出来的、raw HTML 没有 → 要拿真数字得用 **Chrome MCP（navigate + get_page_text，JS 渲染后）** 或 Firecrawl（从可达路径）。
- **修法方向**：promo snapshot 不该靠 bash urllib（代理挡）；改用 web_fetch（拿得到壳、但要 JS 的拿不到数字）或 Chrome MCP（能拿数字）。脚本在沙箱内跑不通是结构问题、不是临时网路问题。
- **教训**：工具失败先分清「哪条网路路径失败」再下结论；bash 沙箱 ≠ web_fetch MCP ≠ Chrome MCP，三条出口策略不同。

---

## 2026-06-14 · W24 发布：本机 repo 与远端历史分岔、push 连环被拒（标准修复流程）

### 症状（依出现顺序）
1. 沙箱内 `.git/index.lock` 删不掉（`Operation not permitted`）→ 排程那端 commit/push 跑不动、只能产好档让本机手动推。
2. 本机 `git push` 被拒 `! [rejected] (fetch first)` → 远端有本机没有的提交。
3. `git pull --rebase` 报 `cannot pull with rebase: You have unstaged changes`。
4. `git stash -u` 后 rebase → 一连串 `CONFLICT`（docs/2026-W18 / W19 / index.html）+ `detached HEAD`。
5. 解完终于 push → `GH007: Your push would publish a private email address`。

### 根因
- **本机 repo 与 `origin/main` 整段历史分岔**（本机 5 笔、远端 38 笔，同名 W18–W23 publish commit 两边对不上）。不是单纯落后、是平行宇宙 → 逐笔 rebase 必撞车。
- 多半因为排程／网页／另一台机各自 commit、本机从没 `git pull` 同步过。

### 标准修复流程（下次直接照贴、不要再逐笔解冲突）
```bash
cd ~/文件/Claude/cowork/daily-brief
# 1) 脱离任何卡住状态
git rebase --abort 2>/dev/null; git merge --abort 2>/dev/null
git checkout main
git stash pop 2>/dev/null            # 若之前 stash 过、把工作档拿回来

# 2) 确认成品稿在硬碟（reset 不会删未追踪档、但先确认）
ls -la weekly-YYYY-MM-DD.html weekly-YYYY-MM-DD-en.html weekly-YYYY-MM-DD.md

# 3) 本机对齐远端（丢掉本机分岔提交、远端是权威）
git fetch origin
git reset --hard origin/main         # 只动 git 追踪档；weekly 成品 + snapshots 是未追踪、安全

# 4) 用成品重产 W24 + 更新 index（脚本编辑的是「远端那版」干净 index）
./prepare-for-github.sh YYYY-MM-DD "Wxx：5 主轴一句话"

# 5) 只提交 3 个发布档、推
git add docs/2026-Wxx.html docs/2026-Wxx-en.html docs/index.html
git commit -m "2026-Wxx: weekly brief + EN"
git push origin main
```
**关键洞察**：`reset --hard origin/main` + 重跑 `prepare-for-github.sh`＝完全绕开手动解冲突。因为脚本编辑的是 reset 后的干净 index（含远端 W18–W23），W24 直接叠上、不会盖旧週。weekly 成品稿是 gitignore／未追踪、reset 不会删。

### GH007 邮箱保护（最后一道）
- 根因：commit 作者邮箱是私人 Gmail（`runowu@gmail.com`），GitHub 开了「不让命令行暴露邮箱」。
- 修法（只对本 repo 生效）：
```bash
git config user.email "12059827+Casillaswu@users.noreply.github.com"   # noreply 在 github.com/settings/emails
git commit --amend --reset-author --no-edit
git push origin main
```
- 已于 W24 设好本 repo 的 user.email = noreply、之后不会再撞 GH007。

### 沙箱端教训
- 排程沙箱对 `.git/` 无写权（index.lock 删不掉）→ **不要期待排程自动 push**。SOP 维持「沙箱产档 + 本机手动 push」，但本机首推前最好先 `git fetch && git reset --hard origin/main` 对齐、避免分岔累积。
- 长期解：找一次把本机与远端彻底同步（或重新 clone 一份干净的），分岔根源就消失。

---

## 2026-06-14 · W24 ⚠️ 外币→台币换算错误（Reagan 抓到、根治）

### 出事
W24 写 PAGCOR MGF「线上赌场每月 ₱9M」换算成「约 840 万台币」。错。₱9M 实际 ≈ 480 万台币（用错汇率、套了 ~0.93、PHP→TWD 真值 ~0.53）。Reagan 抓到后要求把**所有跑过的 weekly 换算重新比对**。

### 全盘复查结果（2026-06-14 现汇：USD 31.6 / GBP 42.3 / EUR ~36 / MOP ~3.93 / PHP ~0.53 / BRL ~5.6 / CAD ~22.5）
查出 **3 类错误**，已全修（working + docs + EN）：
1. **W24 ₱9M：840 万 → 480 万**、₱3M：280 万 → 160 万（PHP 汇率套错、~0.93 vs 真 0.53）。EN：NT$8.4M → NT$4.8M。
2. **W22（05-31）$351M：「约 11 亿」→ 112 亿**（算术掉一位、10x 错）。EN：TWD 1.1bn → NT$11.1B。
3. **W21（05-24）MOP$12.65B / 12.7B：「约 1,580 亿」→ 497 / 499 亿**（3x 错；离谱到「17 天比整月 900 亿还高」一眼该看出不对）。注：**W21 的 EN 版当时是对的（~NT$50B）**、只有 CN 版错——双语版本数字没对账。
4. **W24 £243.1M：98 亿 → 103 亿**（GBP 用 ~40、真值 42.3、live brief 该用现汇）。EN：NT$9.8B → NT$10.3B。

其余几十笔（USD/EUR/MOP/CAD/BRL/VND）复查皆 OK 或属 FX 漂移（旧刊用当时汇率、不回头改历史）。

### 根因
- 凭印象套汇率、没即时查；个别地方算术掉位数（11 亿 vs 112 亿）。
- 双语版各算各的、没交叉对账（W21 CN 错 EN 对）。
- 量级合理性没自检（17 天 GGR 不可能 > 整月）。

### 硬规则（写进 SOP、以后每篇必跑）
1. **任何外币→台币，先即时查当日汇率反推**（WebSearch「X to TWD exchange rate <月份>」），不准凭记忆。常用锚：USD≈31.6、GBP≈42.3、EUR≈36、MOP≈3.93（=HKD/1.03）、PHP≈0.53、BRL≈5.6、CAD≈22.5、VND 极小。**汇率会动、每次重查**。
2. **量级 sanity check**：换算完反问「这数字合理吗」——部分期 < 整期、日均 × 天数 ≈ 总额、单笔罚款不会比公司市值大。一眼离谱就是算错。
3. **USD 反推法兜底**：多数外媒给「本币（≈US$X）」，先换 USD→TWD（×31.6）当量级校验，跟本币直算对得上才放行。
4. **双语版数字对账**：CN 改完、EN 跟着改，两边同一笔金额的台币/NT$ 必须一致（W21 就是没对账才一边对一边错）。
5. 自验脚本可加一条：grep 所有「（约 … 台币）」+ 「(about NT$…)」列出来人工扫一遍，别埋在长文里。


---

## 2026-07-19（W29）Reagan 第二轮意见 — 术语没套用 + 标题要读得懂 + 整篇去重

**背景**：W29 第一版交付后 Reagan 抓出三类老问题，其中「死线→期限」W25 就记过、W26 犯过、W29 又犯——**规则记了但产出时没套用**。根因：SOP step 1 读 lessons-learned 是「读过」不等于「写作时逐条对照」。修法：以下词表并入 `_design-notes.md §7.7 黑名单表`（写作阶段的真值表），产完 grep 自查。

### 术语强制表（写进 §7.7、每周产出后 grep 确认 0 残留）

| 禁用 | 改用 | 备注 |
|---|---|---|
| 死线 | 期限 | W25 已记、W26 / W29 重犯，第三次 |
| 强制下线 | 强制下架 | W29 新增 |
| 低摩擦 / 高摩擦 / 摩擦差距 | 下注省事 / 关卡多、少 | 「摩擦」是行话，要用就先解释 |
| 量化了 | 变成了具体数字 | |
| XX 主题：（Editor's Pick 标题前缀） | 完整句标题 | 「M&A 主题：」读者不知道是啥；标题必须自含结论 |

### 标题规则（W29 教训）

- **标题 = 读懂内文后去芜存菁**，让人一看就知道这张卡讲什么。反例：「预测市场往『更像金融』和『更像赌博』同时长」（像悖论、看不懂）→ 正例：「预测市场的两面：产品设计像金融商品，实际用途是赌博」。
- 持续追踪卡的标题不能只写进展（「Kalshi 上诉第二巡回」），要带前因（「Kalshi 在纽约败诉后上诉」），不知道前情的人才接得上。

### 整篇去重（跨 section，不只跨周）

- W29 第一版 34 张 card 里：里约 decree 出现在 §1+§6、STF 出现在 §1+§6、DraftKings 世界杯出现在 §2+§4、世界杯 PM 成交量出现在讯号 01+§7+§8。Reagan：「这篇读下来就这几个议题」。
- **规则：同一事件全篇只有一张主 card（放在最相关的 section），其他地方最多一行（详见 §X）交叉引用**。跨周 diff 脚本查不到这种「篇内重复」，写完要自查一轮。

### 事实性表述

- 澳门「靠演唱会回补」要讲完整因果：演唱会、NBA 中国赛这类**观光娱乐活动把人潮带回来，人回来了赌收才回来**——不是演唱会直接变赌收。


---

## 2026-07-19（W29 第三轮）Reagan 意见 — 读者设定 + 机制性改善

**核心批评**：「你到现在还不懂这份报告是给谁看的吗？它不是自己的作业。」——报告对外发布给业内读者，第一版和第二版里留着大量「写给自己看」的痕迹：meta 开场句（「先讲背景」「先说清楚这句话的意思」——后者是在对着上一版的错误解释，读者根本没看过上一版）、占位卡（「维持上周观察、无更新」这种没内容的 Editor's Pick）、行话（低摩擦、M&A 端、切网络、基础设施层）。

### 本轮修正清单（全部三档 + docs 已同步）

1. meta 句全删：「先讲背景」「先补背景」「先说清楚这句话的意思」
2. 冗句删：标题讲过「平台史上最大」，内文不再重复一次
3. 超级碗 → 橄榄球超级杯（Super Bowl）
4. 数字口径要自己讲清：250 亿（世界杯合约）vs 500 亿（平台全部盘口）两个数并排必须说明口径、否则读者以为冲突
5. 「持牌方不是没有反应」→「拿州牌照的传统运动博彩公司也在动」（主语讲清楚）
6. 「切网络」→「封网」（中文母语惯用）；「基础设施层」→ 讲具体手段
7. EP 卡因果要成立：法国封网（政府行政令）+ Google 下架（公司商店政策）是两个不同工具，不能写成「监管不告平台了」这种把美国监管也框进来的结论
8. 「M&A 端」→「并购市场」；§2 标题改「并购（M&A）与资本动作」
9. 占位 EP 卡直接删（§4「无更新照旧」卡），没话说就不摆卡
10. 硬凑结论的 EP 卡拆掉：菲律宾+澳门硬并成一句很怪 → 改成只讲菲律宾的一条线
11. 标题自含结论：§6 警语卡加「巴西」前缀；NEXT.io 卡标题直接写出两条路；§7 EP 标题写出两件事是什么

### 机制性改善（回应「为什么都没记住」）

「记在 lessons-learned + 产出时对照」已证明三次失效（死线 W25/W26/W29）。改成**脚本硬挡**：
- 全部术语 + meta 句 + 行话已加进 `scripts/de_ai_lint.py` BLACKLIST（死线、强制下线、低摩擦、高摩擦、摩擦差距、量化了、先讲背景、先补背景、先说清楚这句话、M&A 端、法规端、切网络、基础设施层、「主题：」前缀）
- de_ai_lint 是 SKILL 自我验证的必跑项、命中即 exit 1，交付前必须清零——从「靠记忆」变成「过不了关就出不了门」
- 以后 Reagan 每抓一个新词 → 当场加进 de_ai_lint BLACKLIST，这是唯一可靠的沉淀路径

### 读者设定（写进 _design-notes §7.13）

报告读者 = 博彩业内人士与客户（对外 GitHub Pages 发布），不是编辑自己。三条自查：
1. 这句是在跟读者说话、还是在跟自己（或上一版）说话？后者删
2. 这张卡拿掉，读者有损失吗？没有就删（占位卡、无更新卡）
3. 两个数字并排，读者会不会以为矛盾？会就把口径讲清


---

## 2026-07-19（W29 第四轮）Reagan 意见 — 数字口径、行溢出、黑底黄标

### 数字口径：同类数字并排必须标清各自「算的是什么盘」
- Kalshi $1.27B = 「阿根廷对西班牙决赛」单场合约（赌这一场谁赢）；Polymarket $4.2B = 「谁拿本届冠军」的冠军盘（开赛前就能下、所有队都在盘上）——两个不是同一种盘，第一版没讲清、读者会当成矛盾。
- 250 亿（世界杯合约合计）vs 500 亿（平台全部盘口）那句「两个数字不冲突」的解释被 Reagan 判定「说的也不清楚」→ 直接删掉 500 亿那句，只留口径单一的 250 亿。**教训：解释不清的数字宁可删，不要硬解释。**

### 行溢出规则（Reagan 用「减少 N 个字元」标注）
- 他给的 N = 该行在他屏幕上溢出的字数。X Pulse 条目行、next-list 行、signal-key、judge 段——写完要按「一行放得下」修剪，被点名的按 N 或更多砍。
- 常见可砍词：「今天剩」→「剩」、「随着」、「这类观光娱乐活动」、「答案更进一步」→「更进一步」、「成长驱动的扩张」→「成长扩张」、「讨论」→「讲」、「形成对比」→「的风气相反」。

### 视觉规则
- **黑底卡（.hilite-na）的 h4 禁用 .hi 黄底**——黄底配白字看不清（已修，写进 _design-notes §3.5）。

### 事件卡要挖到「发布了什么」
- BetConstruct 那张第一版只写「办了活动、谈 AI 预测产品」——被问「发布什么？有说明文件吗？」。抓原文后补上实质：ADI Predictstreet 是「FIFA 官方预测市场伙伴」、方案+官方直播权接进平台；DELULU = 5 款游戏（4 slot + 1 Plinko、最高赔 2 万倍）上架 Stake。**教训：活动新闻要写「宣布了什么具体东西」，写不出来就不值一张卡。**

### 新进 de_ai_lint 词表（脚本硬挡）
网络层、系统下线、游戏下线、今天剩。

---

## 2026-07-22（W29 收尾）push 每周报错的根治

**Reagan 质问**：为什么每周 push 都报错、不能一次记住？

**根因两个、都是固定的**：
1. 「remote contains work」被拒 —— 有几周档案是从 GitHub 网页直接上传的，本机 repo 没 pull 过、永远落后远端，裸 `git push` 必被拒。
2. 「cannot pull with rebase: unstaged changes」—— weekly 每周改一堆工作档（md、README、lessons-learned、scripts），没提交就挡 rebase。

**真正的坑**：`push.sh`（6/17 建）本来就处理了锁 + pull --rebase，但 AI 收尾时给的是零散 git 指令、没叫 Reagan 跑它；且旧版 `push.sh` 只 `git add -A docs`，工作档留着不暂存 → 正好撞根因 2。已修成 `git add -A` 全仓库。

**硬规则（每周收尾唯一说法）**：发布指令只给这一条、不给零散 git 指令：
```bash
cd ~/文件/Claude/cowork/daily-brief && ./push.sh "Wxx: weekly brief + EN"
```
撞到冲突脚本会自己停下来叫 Reagan 贴讯息回来，其余情况一条跑完。

## 2026-08-09（W32）母语化 v2 + 语意层去重（Reagan 反馈）
- **根因**：de_ai_lint 通过 ≠ 母语感——网络腔（实锤/吃掉/腰斩混搭）+ 缺因果连接 + 语意层重复，脚本都查不到。
- **修法**：见 `_design-notes §7.16`（真值源）。三条：(1) 网络腔词→精准书面动词（实锤→说明、吃掉→侵蚀、转亏→转盈为亏）；(2) 并列堆砌补因果连接（造成/使得/因而）；(3) 语意层去重——同一主线的多张卡各留独有洞见、判断段不复述套话。
- **W32 落地**：整篇 md + CN/EN html 重写；§7 由「实体赢纯线上输」（与 §4 重复）改为「补充品 vs 替代品」品类定位，去掉与讯号 01/§4 的语意重复。

---

## 2026-08-23（W34）— 一次退回，三个错：byline 漂移、没去重、内部报告腔

**发生什么**：W34 第一版交出去被 Reagan 全部退回，附了 W30 与 W34 的截图对照。三个问题：

### 错误 1：卡片格式漂移（byline）

W34 每张 col-card 在 `<h4>` 上方多了一行 `<div class="byline">LATAM · BRAZIL</div>`，跟 meta-row 里已有的「拉美 · 巴西」pill 完全重复，视觉上多一行灰字、把卡撑高。

查证：`grep -c 'class="byline"'` — W29=0、W30=0、W31=0、W32=0、**W33=19、W34=62**。这个元素是 W33 开始混进来的，W34 把它放大了三倍。W29–W32 的 canonical 卡片结构是：

```
meta-row（cat + sentiment pill + 「地区 · 主题」pill）→ h4 → src → body → judge → cta
```

**没有 byline 这一层。** 而且第三颗 pill 应该是**主题标**（「巴西 · 授权规则」「巴西 · 市场结构」），不是地区重复（「拉美 · 巴西」）。

**防呆**：产完 HTML 必跑
```bash
grep -c 'class="byline"' weekly-YYYY-MM-DD.html   # 必须 = 0
```
并把第三颗 pill 写成「地区 · 主题」，主题要能一眼看出这张卡在讲哪一类事。

### 错误 2：完全没做 §7.15「每事件一卡」

W34 第一版 64 张 card。同一个事件在 5 讯号讲一遍、在 §1 讲一遍、在 §5 或 §8 再讲一遍，中间用「（详见讯号 0X）」串起来。这正是 §7.15 在 W31 明令废掉的做法——老板读起来是同一个故事重复三次。

另外还塞了 §7.13 明令禁止的东西：「Editor's Pick 维持 W32 观察、无更新」这种占位卡、「越南本周无重大动态」这种没有信息的卡、「W33 持续追踪⋯判断维持」这种要求读者记得上周的卡。

去重后 64 → 34（30 张 col-card + 2 张 X Pulse + lead + 4 signal-card），砍掉的全是复述与占位。

**防呆**：产完必跑
```bash
grep -c '详见讯号\|判断维持\|持续追踪\|本周无重大动态\|无更新' weekly-YYYY-MM-DD.html   # 必须 = 0
```
写每张 § 区卡之前先问：这件事讯号区讲过了吗？讲过就不开卡。

### 错误 3：写成内部作业报告，不是给决策者的简报

Reagan 原话：「用字遣词要用的正简报给对方的概念，而不是对方在看一个内部小朋友提的报告」。

具体病灶（对照 W30 的卡就很明显）：
- **body 太长**：W30 的 body 是 2-3 句、约 60-90 字；W34 第一版写到 5-8 句、200 字以上，把背景、脉络、来龙去脉全铺开。
- **judge 太长且在讲课**：「这说明⋯」「这个模式反映的是⋯」「值得单独记一笔的是⋯」这类教科书过场句大量出现，`de_ai_lint` 查不到（它只查形式层黑名单）。
- **句子结构翻译腔**：一句里塞三个分句 + 破折号补充，念出来不像中文母语者会讲的话。

**修法**：body 压到 2-4 句、judge 压到 2-3 句 + 一句「落到执行」。每句念一遍，念不顺就砍。

### 顺带：§7.17 减字省行这次也没做

用估算器（全角字 ≈ 单行 22 字 / 3 栏 col-card）扫 h4，**13 个标题末行只剩 1-5 个字**，全部改短到单行或末行 ≥ 6 字。这一步应该在产完 HTML 后自动跑，不是等被抓到才补。

```python
# 孤行标题扫描（Chrome 扩充强制 https、开不了 file://，只能估算）
import re,io,unicodedata
c=io.open('weekly-YYYY-MM-DD.html',encoding='utf-8').read()
w=lambda t: sum(1 if unicodedata.east_asian_width(ch) in 'WF' else 0.5 for ch in t)
for m in re.finditer(r'<div class="meta-row">[^\n]*</div>\s*\n\s*<h4>(.+?)</h4>', c):
    h=re.sub(r'<[^>]+>','',m.group(1)).strip(); tot=w(h)
    lines=max(1,-(-int(tot*10)//220)); last=tot-(lines-1)*22
    if lines>1 and last<=5: print('修', tot, '末行', last, h)
```
signal-card 在 2 栏 grid、单行约 36 全角字，用同一套算法换参数。

### 结论：产完 weekly 的强制 4 项检查（加进 SOP）

1. `byline = 0`
2. 跳转复述词 = 0（详见讯号 / 判断维持 / 持续追踪 / 无更新 / 无重大动态）
3. col-card 总数 ≤ 35，且每个事件只出现一次
4. h4 孤行扫描 = 0

这四项跟 de_ai_lint 一起跑，缺一项就是半成品。

---

## 2026-08-23（补）— 排版孤行要量线上，不要估算；顺手修了 W33

**起因**：Reagan 给了线上网址 `https://casillaswu.github.io/daily-brief/2026-W33.html`，要求「用线上版看一下有没有过长、差几个字元就多了一行这种的」，并要求 W33 也一起更新。

### 关键发现：GitHub Pages 是 https，Chrome MCP 开得了

`_design-notes` §7.17 记的是「Chrome 扩充强制 https、开不了本地 file://，只能估算」——这句话只对了一半。**发布后的 GitHub Pages 页面本身就是 https，Chrome MCP 可以直接开**，等于有了一个跑着真实 CSS 的量测台。估算从此只用在「还没发布」的当期草稿上，而且可以拿上一期的线上页当量测台。

实测出来的真实参数（视窗 1440、内容区 1314px）：

| 项目 | 数值 |
|---|---|
| col-card 宽 | 368px，h4 可用宽 **330px** |
| signal-card h4 可用宽 | **522px** |
| h4 字级 / 行高 | 14.5px / 21.75px |
| 单行容量 | col-card ≈ **22.7 全角字**、signal-card ≈ **36 全角字** |

### 量测台做法（可重复用）

```js
// 1) 量任一元素的真实行数与末行填充率
window.__m=function(el){
  var r=document.createRange(); r.selectNodeContents(el);
  var rc=Array.from(r.getClientRects()).filter(function(x){return x.width>0.5;});
  var rows=[]; rc.forEach(function(x){
    var g=rows.find(function(y){return Math.abs(y.top-x.top)<4;});
    if(g){g.left=Math.min(g.left,x.left); g.right=Math.max(g.right,x.right);}
    else rows.push({top:x.top,left:x.left,right:x.right});
  });
  var av=el.getBoundingClientRect().width, l=rows[rows.length-1];
  return {lines:rows.length, fill:Math.round((l.right-l.left)/av*100)};
};
// 2) 把候选标题塞进真实卡片试排、量完还原
window.__try=function(el,cands){
  var o=el.innerHTML,out=[];
  cands.forEach(function(c){el.innerHTML=c; var m=__m(el); out.push({lines:m.lines,fill:m.fill,t:el.innerText.trim()});});
  el.innerHTML=o; return out;
};
```

**判定线**：`lines > 1 && fill <= 30%` = 孤行、要修。改完的目标是单行且 `fill` 落在 **70-92%**——低于 70 是浪费版位，高于 95 有换行风险（不同机器字体渲染会差一两个字）。

### 估算器漏抓的证据

W34 我用估算器（阈值「末行 ≤5 全角字」）扫过、判定 0 孤行；拿到线上量测台一跑，**CN 还有 4 个、EN 还有 3 个**孤行，末行都是 6 个字左右，刚好落在阈值外。结论：估算器只能当粗筛，最终一定要上真实 CSS 量。

### 这次一并修掉的

- **W33**：byline 19 处（CN）+ 19 处（EN）全数移除；CN 修 5 个孤行标题、EN 修 11 个（含 7 个线上实测出来的 + 4 个跟 CN 对齐的）。
- **W34**：CN 再修 4 个、EN 再修 3 个。

### 加进收尾 SOP

产完 weekly、发布前跑一次线上量测：开上一期的 GitHub Pages 页当量测台 → 把本期所有 `h4`（col-card 与 signal-card 分开量，宽度不同）塞进去量 → `fill <= 30%` 的逐条改到单行且 fill 70-92%。这一步取代原本的估算器复检。

---

## 2026-08-23（补二）— `.stat-strip` 跟 `.law-box` 根本没有 CSS；抽象说法要换成实际数字

Reagan 截了两张图问「这个字体是不是也大了」，附的是 §5 的四格数字条与 §6 的法案清单。

### 错误 4：用了 stylesheet 里不存在的元件

`_design-notes` §2 的 11-section 规格写着 §2 / §5 用 `.stat-strip`、§6 用 `.law-box`，我照着写了。实际一查：

```bash
grep -c 'stat-strip\|law-box' weekly-*.html   # W29 到 W33 全部 = 0
grep -n '\.stat\|\.law-box' weekly-2026-08-23.html   # <style> 内 0 命中
```

**这两个 class 在 canonical 的 `<style>` 里从来没有被实作过**，W29 之后也没有任何一期用过。写上去的结果是裸 `div` 跟裸 `ol`：`<b>−31%</b><span>菲律宾线上 GGR</span>` 挤成一行、字级吃 body 预设（比卡内文 12.5px 大一号），法案清单同理。图上看到的「字体大了」就是这个。

**修法**（不动 `<style>`，那是 canonical 明令不可改的）：
- `.stat-strip` → 换成 `<p class="sec-note">`（有 CSS：12px、`--ink-3`），四个数字用 `·` 串一行。
- `.law-box` → 换成一张常规 `.card`（`hilite`），清单内容写进 `<p>` 段落，字级自动吃 12.5px。

**防呆**：产完 HTML 跑一次「用到但没定义的 class」检查——
```bash
python3 - <<'EOF'
import re,io
c=io.open('weekly-YYYY-MM-DD.html',encoding='utf-8').read()
css=c[c.index('<style>'):c.index('</style>')]
used=set(re.findall(r'class="([^"]+)"',c))
names={n for u in used for n in u.split()}
print('未定义：', sorted(n for n in names if '.'+n not in css))
EOF
```
`_design-notes` §2 那张表列的元件不等于 stylesheet 支援的元件，规格文件跟实作有落差时**以 `<style>` 为准**。

### 错误 5：有实际数字却写抽象说法

原文：「六成以上持牌的博彩系统管理商掉在 PAGCOR 新设的最低营收门槛之下」。
Reagan 直接改写示范：「六成以上菲律宾持牌线上运营商营收达不到 MGF 900 万」。

两个病灶：
1. **有数字就说数字**。「新设的最低营收门槛」读者要往下读三行才知道是多少，直接写「MGF 900 万披索」当场就懂。凡是「新门槛 / 新规定 / 某个上限 / 一定比例」这类占位说法，只要正文里有具体数字，标题跟首句就该把数字提上来。
2. **别用官方术语当主词**。「博彩系统管理商」（GSA）是 PAGCOR 的法定名称，不是业内讲话会用的词，一律写「线上运营商」。

### 错误 6：判断句抽象到读者看不懂

Reagan 点名两句：「Bet442 在英超获客战里跑在前面」「体育赞助的买方在换人，这次不会换回来」。

- 第一句的问题是**没有内容**——原始材料我只用了一句「SBC 分析指它领先」，没讲它做了什么。回头把原文读完才发现有实料：体育负责人 Liam Normanton 讲的是「不做整季平摊、只压在真实下注意图出现的时刻，用单场赛事战役去接」，还给了留存三项指标。改写成这个就有用了。**教训：一句话的新闻要嘛读到有实料再写，要嘛不写。**
- 第二句是抽象比喻（§7.14 第 2 条明令禁止）。「买方在换人」谁换谁？改成「英超胸前版位被金融业接走，博彩买不回去了」——主词、动作、结果都在。

**自审题（加进收尾检查）**：每个标题念一遍，问「这句话里有没有一个具体的人、机构、数字或动作？」三者皆无就是抽象，退回重写。

---

## 2026-09-06（W36）§0 触发讯号回顾：来源不可达不等于没有触发；HTML 落地改为併进对应市场区块

### 错误 1（严重）：`_shared/` 读不到，却把 §0 写成「本周无触发 brief 累积，跳过」

W36 第一版 §0 写「本周无触发 brief 累积，跳过。」实际情况是排程沙箱只挂了 `daily-brief/`，`/Users/cw/文件/Claude/cowork/_shared/` 根本不在挂载里，`find -name "trigger*"` 回 0 笔。**读不到 ≠ 没有**，我把「查不到」推定成「不存在」，直接漏掉整整 7 条巴西触发讯号（Reagan 事后提供，第一版 `grep Pixbet|Senacon|Procon|1.287|Brilliant` = 0）。

漏掉的不是边角料：其中 Procon-PE 9/4 开查 36 家、46 项合规点明文含网红与联盟行销，是本期对接案端最直接的一条；Trigger 5+6+7 合起来构成第一版完全没看到的第四条线（消保线），直接推翻了 §6 编辑观察「三条线同时在收」的分类。

**防呆（硬性）**：SOP step 1 读 trigger 档时，先确认路径存在：

```bash
test -d /sessions/<id>/mnt/_shared && echo "OK" || echo "UNREACHABLE"
```

- 路径存在、`trigger-*.md` 为 0 笔 → §0 才可以写「本周无触发 brief 累积，跳过。」
- **路径不存在 → §0 一律写「本周 trigger 来源不可达、待补」，并在收尾五行的 `🎯 §0 trigger 回顾` 那行标出「来源不可达」，不得写成数字 0。**

同理适用于任何「来源抓不到」的场景（PH promo、X Pulse、某个 Tier 1 站）：抓不到就说抓不到，不要用「本周无重大动态」把空白包起来。这跟「没料就说没料」是同一条，但方向相反——那条防的是灌水，这条防的是把失败静默成结论。

### 错误 2：§0 的 HTML 落地照抄选项 A，结果排出 09 → 00 → 10

`SKILL.md` 对 §0 的 HTML 落地本来就标着「待补设计」，给的是两个过渡选项：≥3 条走选项 A（§10 之前插 TRIGGER REVIEW col-card row）、0-2 条走选项 B（只留 md）。W36 有 7 条 → 走 A。

两个问题：

1. 我为了跟其他区块视觉一致，给它套了 `section-head` 的 `num`，写成 `00`，版面变成 09 → **00** → 10，读者只会以为排版坏了。选项 A 原文只说插 col-card row，没说要给编号。
2. 更根本的：选项 A 把区块放 §10 前，是**迁就 nav 与 section id 不能动**的结构性妥协，不是照阅读逻辑。md 主档里 §0 排在 5 大讯号之后，HTML 却跑到倒数第二，两边顺序对不上。

而且 W36 这 7 条全是巴西，等于把同一个市场切成两块——§6 拉美 4 张卡，另外 7 张巴西卡隔了七个区块。这正是 `_design-notes §7.15` 去重规则要避免的事。具体症状：Trigger 7（SPA 罚 Brilliant Gaming）与 §6 既有的「SPA 已撤销 26 家、首波罚单打身份验证」是同一监管机关同一条执法线，分处两地各讲一次。

### 修法（Reagan 2026-09-06 拍板，取代 SKILL.md 的选项 A / B）

**md 与 HTML 分工，各自服务不同目的：**

| | 内容 | 目的 |
|---|---|---|
| **md 主档 §0** | 永远保留完整 §0（每条：原始档名 + 事件 + `<u>当时判断</u>`原文 + 一周后 follow-up） | 稽核轨迹——下週要查「W36 当时怎么判的」看这里；散进各区块就没办法回头评估 trigger monitor 准不准 |
| **HTML 视觉版** | trigger 卡**按主题併进对应市场 / 主题区块**，不另开区块、不加编号 | 服务读者——同一个市场只在一个地方出现 |

**併入规则**：
- **≥3 条且集中在单一市场** → 全部併进该市场区块（W36：7 条全巴西 → 併进 §6，§6 变 11 张卡，按主题排序：州级司法 → 联邦财政 → 消保三条 → 个案罚单（与既有 SPA 撤照卡相邻）→ 封网 → 税制 → 拨款 → 墨西哥 → 编辑观察）
- **分散在多个市场** → 各自併进所属区块（法规进 §1、拉美进 §6、亚洲进 §5⋯）
- **0-2 条** → 沿用旧选项 B，只留 md
- 併入后**判断文字一字不改**，出处栏照标 `trigger-YYYY-MM-DD.md · 媒体 · MM/DD`，并保留「一周后 follow-up」那一行——来源看得出来，读者眼里是一整块
- 单一区块因此变厚（W36 §6 = 11 张，其他区块 3-5 张）是可以的：那一週那个市场真的出了那么多事，比例失衡是诚实的，不是灌水
- 11 个 section id 与 nav 11 个锚点**都不用动**，canonical 不变

**交叉引用写法**：md 在 §0、HTML 在同一区块，所以引用语要中性——写「（详见本期 Trigger 5 至 Trigger 7）」，不写「详见 §0」也不写「详见本节」。

**连带检查**：trigger 补进来之后，一定要回头看既有卡的分类还对不对。W36 §6 编辑观察原写「三条线（行政、司法、电信）」，Trigger 5-7 补进来后更正为「四条线（行政、发照、电信、消保）」；§10 也补了 🔴「9 月中 Procon-PE 10 个工作日举证期限届满」。**补内容不改结论 = 只做了一半。**

### 错误 3（承 W35 未修完）：标题长度检查器的 EN 门槛比实际容量宽一倍，等于没在检查

W36 CN + EN 上线后用 Chrome 量线上页：CN 6 个孤行、**EN 43 个标题有 39 个是三行、16 个孤行**，而 `check_headline_len.py` 回报「✅ 全部合格」。

根因不是这次写太长，是 `_design-notes §7.21` 的容量表把「EN col 一行」写成 70 字元（实测 36），检查器的 EN 上限 col=64 全角当量（= 128 字元 ≈ 3.5 行）照着这个错数字订，所以放行一切。

**W35 踩过同一个坑**（EN 23 个三行标题 + 7 个孤行），当时的结论写成「估算法在 EN 上完全失准，必须上线实测」——只补了流程、没回头修门槛，所以 W36 原样再犯。**教训：发现工具给了错误的绿灯，要修工具，不是只补一道人工检查。**只补流程等于把同一个错误留在原地，下次照样触发。

**修法**：
1. `check_headline_len.py` 改版——不再只比最大当量，改用实测每行容量做换行模拟，同时挡「行数超上限」与「末行 < 38% 的孤行」。容量常数写在脚本顶端 `CAP_CN` / `CAP_EN`。
2. `_design-notes` 新增 §7.23 记实测容量表，声明取代 §7.21 旧表。
3. W36 依新门槛重写 43 个 EN 标题（col 收到 50–72 字元、signal 70–102、lead ≤125）+ 4 个 CN 标题，重出重推。

**顺带确认的写法**：EN 标题砍到 50–72 字元后，句型仍能守住 §7.19 的「主体 + 数字 + 原因」——砍掉的都是连接词和修饰语（`and none of them`、`this year`、`at once`、`in that opening week`），资讯没掉。**长不等于讯息多。**

**W36 第二轮实测补记**：重写后 EN 三行 39 → 0、孤行 16 → 8，CN 孤行 6 → 3。剩的几乎都是末行 30–37%。查下来发现 **EN col 的 38% 门槛实务上做不到**——318px 一行只放约 36 个英文字元，55–70 字元必然两行且末行 30–37%，要过 38% 得写到 72 字元以上、又会变三行，窗口太窄。已把 EN col 的孤行下限放宽到 30%（CN 维持 38%），写进 `_design-notes §7.23` 补充。**不要为了凑门槛塞填充词**——那违反 §7.19「砍冗词」，宁可留 33%。
