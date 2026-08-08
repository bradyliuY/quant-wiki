# 指标/策略库新手友好补齐实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐指标库与策略库的缺口：新增唐奇安通道指标页、价值低估策略族（2 策略）、事件驱动策略族（2 策略），并把全站 5 大策略族 → 7 大策略族、16 指标 → 17 指标、18 策略 → 22 策略的引用同步到位。内容全部面向零基础小白，沿用「一句话 → 大白话 → 动态演示 → 走读 → 规则 → 回测参考」模板。

**Architecture:** 纯内容层 + 主题层改动。新增 7 个 Markdown 页（1 指标 + 2 族 × (index + 2 策略)），唯一组件改动是 `StrategyFit.vue` 的 `STRATEGIES` 数据数组追加两行（纯数据，无逻辑改动），其余为侧边栏/overview/index/code-examples 的文本同步。价值/事件驱动策略不做 K 线信号，动态演示统一用 `KLinePlayback variant="line"` 净值曲线（与多因子页一致），避免硬造买卖点标注。

**Tech Stack:** VitePress 1.6、Vue 3、lightweight-charts v5（KLinePlayback `strategy="channel"` 复用既有唐奇安通道模式）、`PESim` 组件内嵌。

**验证（本仓库无测试套件，遵循 CLAUDE.md 强制流程）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：验证 `/indicators/volatility/donchian`、`/strategies/value/`、`/strategies/event-driven/`、`/strategies/overview`、`/` 五页，CDP 抓 `Runtime.exceptionThrown` 无 JS 错误、KLinePlayback 的 canvas 真实渲染、StrategyFit 出现 7 行

**提交规范：** Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

## Task 1: 新增唐奇安通道指标页

**Files:**
- Create: `docs/indicators/volatility/donchian.md`
- Modify: `docs/.vitepress/config.ts`（volatility 侧边栏加一项）
- Modify: `docs/indicators/volatility/index.md`（表格加一行）
- Modify: `docs/indicators/index.md`（波动率分类表加一行）
- Modify: `docs/indicators/overview.md`（「指标有 16 个」→17，波动率行补唐奇安）

**Step 1: 创建 `docs/indicators/volatility/donchian.md`**

frontmatter `difficulty: 入门`。结构：一句话总结 → PlainTalk → 公式 → 关键参数表 → 动态演示（`<KLinePlayback strategy="channel" title="唐奇安通道行情回放" />` + 图例表）→ 手把手算（手动演算，无 CalcDemo 模式）→ 信号解读（突破上沿做多/跌破下沿做空/通道收窄）→ 一次实战解读 → 实战用法（海龟/通道突破/布林对比）→ 常见误区 → 相关。

要点：
- 公式：`上沿 = 最近 N 期最高价`, `下沿 = 最近 N 期最低价`, `中轨 = (上沿+下沿)/2`（可选）
- 参数：N 默认 20（入场）、10（离场）——呼应海龟双通道
- 图例颜色：上沿 `rgba(30,95,208,0.5)` 半透明蓝、下沿 `#26a69a` 绿、中轨 `#1e5fd0` 蓝（与 KLinePlayback `channel` 策略内置色一致）
- 相关：链接海龟、通道突破、布林带、肯特纳

**Step 2: config.ts** 在 volatility 侧边栏 `{ text: '肯特纳通道', ... }` 后加：
```ts
{ text: '唐奇安通道', link: '/indicators/volatility/donchian' }
```

**Step 3: `docs/indicators/volatility/index.md`** 表格加行（难度 入门）：
```md
| [唐奇安通道](./donchian) | <span class="dlv dlv-beginner">入门</span> | 周期高低点极值通道，突破交易的地图 |
```
并在「怎么选？」加一条：`- 想做突破 / 画趋势通道：**唐奇安通道**`。

**Step 4: `docs/indicators/index.md`** 波动率分类表加行：
```md
| [唐奇安通道](./volatility/donchian) | 周期高低点极值通道 | 海龟交易的核心通道 |
```

**Step 5: `docs/indicators/overview.md`** 三处：
- 「指标有 16 个」→「指标有 17 个」
- 波动率行「布林带、ATR、肯特纳」→「布林带、ATR、肯特纳、唐奇安」

**Step 6: 验证**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链

**Step 7: Commit**
```bash
git add docs/indicators/volatility/donchian.md docs/.vitepress/config.ts docs/indicators/volatility/index.md docs/indicators/index.md docs/indicators/overview.md
git commit -m "feat: 新增唐奇安通道指标页并同步侧边栏/索引"
```

---

## Task 2: 新增价值低估策略族

**Files:**
- Create: `docs/strategies/value/index.md`
- Create: `docs/strategies/value/low-valuation.md`
- Create: `docs/strategies/value/dividend-yield.md`

**Step 1: `docs/strategies/value/index.md`**

族 index（仿 quantitative/index.md）：一句话定位 → 策略一览表（低估值筛选 进阶 / 高股息 进阶，带难度徽章）→ 共性特征（基本面数据驱动、长线、价值陷阱风险、需财报阅读能力）→ 参考（估值方法、财务报表、风险管理）。

**Step 2: `docs/strategies/value/low-valuation.md`**（难度 进阶）

标题「低估值筛选策略（便宜买好货）」。结构：
- **一句话**：用 PE/PB 等估值指标从全市场挑便宜的优质公司，等价格回归价值——赚「估值修复」的钱。
- **PlainTalk**：把「低估值」比作打折买好货——同样质量的东西，等它打 7 折再买，胜率更高。
- **核心逻辑 + SignalFlow**：`选股池 → 估值打分（PE/PB）→ 质量过滤（排除低估值陷阱）→ 分批建仓 → 估值修复/基本面恶化离场`
- **交互演示**：嵌 `<PESim title="PE 市盈率交互：多少年回本？" />`，解释"PE 是回本年限"。
- **动态回放**：`<KLinePlayback variant="line" title="低估值组合相对基准回放" />`（净值曲线，说明赚的是估值修复）
- **一笔交易的走读**：`<CaseWalk>`（setup 筛出低 PE 标的 → signal PB 分位触底 → entry 分批建仓 → manage 持有至估值回归 → exit 估值修复到中枢 → review 价值陷阱教训）
- **入场规则**：PE 分位 < 20%、PB < 1、股息率 > 3%；质量过滤（ROE、负债率、现金流）；分批建仓
- **出场规则**：估值修复到历史中枢；基本面恶化（业绩下滑）无条件离场；设定持仓时间上限
- **仓位管理**：分散 10-20 只；单票 ≤5%；分 3 批建仓
- **回测参考**（示意数据）：A 股/美股，标注价值陷阱风险
- **适合/不适合**：✓ 大市值、数据完整市场；✕ 成长驱动市场/题材炒作期、无基本面数据标的
- **常见误区**：便宜不等于安全（价值陷阱）；不看质量只比 PE；等不了长线
- **相关**：估值方法、三张财务报表、多因子、风险平价

**Step 3: `docs/strategies/value/dividend-yield.md`**（难度 进阶）

标题「高股息收息策略（稳稳的分红）」。结构：
- **一句话**：买入股息率高且稳定的公司，赚分红 + 缓慢复利——用「收息」替代「价差」，是小白最容易上手的现金流策略。
- **PlainTalk**：把股票当「会分红的存钱罐」——每年定期分给你利息，不用天天看盘。
- **核心逻辑 + SignalFlow**：`筛选高股息 → 检查分红可持续性（自由现金流覆盖）→ 分散配置 → 红利再投资 → 股息率失真/分红下降离场`
- **动态回放**：`<KLinePlayback variant="line" title="高股息组合净值回放" />`
- **一笔交易的走读**：`<CaseWalk>`
- **入场规则**：股息率 > 4%、连续 5 年分红、派息率 < 70%、自由现金流为正
- **出场规则**：股息率跌破阈值（股价暴涨导致）→ 换仓到更高息标的；分红削减 → 清仓
- **仓位管理**：分散 15-30 只；红利再投资；单只 ≤5%
- **回测参考**（示意数据）：分红再投资 vs 不分红
- **适合/不适合**：✓ 低利率环境、退休/现金流需求；✕ 追求高成长者、高波动短期资金
- **常见误区**：只看股息率不看可持续性；把「高息」当「高回报」；忽视除息日价格调整
- **相关**：盈利能力、三张财务报表、低估值筛选

**Step 4: 验证**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链

**Step 5: Commit**
```bash
git add docs/strategies/value/
git commit -m "feat: 新增价值低估策略族（低估值筛选/高股息）"
```

---

## Task 3: 新增事件驱动策略族

**Files:**
- Create: `docs/strategies/event-driven/index.md`
- Create: `docs/strategies/event-driven/earnings-drift.md`
- Create: `docs/strategies/event-driven/index-rebalance.md`

**Step 1: `docs/strategies/event-driven/index.md`**

族 index：一句话定位 → 策略一览表（财报后动量 进阶 / 指数调仓 挑战）→ 共性特征（催化剂驱动、事件窗口、平时空仓、内幕/抢跑风险、纪律要求高）→ 参考（市场机制、经济指标、风险管理）。

**Step 2: `docs/strategies/event-driven/earnings-drift.md`**（难度 进阶）

标题「财报后动量策略（财报惊喜的惯性）」。结构：
- **一句话**：财报超预期后股价往往在随后几周继续惯性上涨（财报后漂移 PEAD 效应），在公告后次日入场吃这段惯性。
- **PlainTalk**：把财报比作「成绩单」——考了 100 分的同学，老师公布后大家才反应过来，掌声会持续一阵子。
- **核心逻辑 + SignalFlow**：`财报公布 → 对比预期（意外方向）→ 确认放量 → 次日顺势入场 → 惯性消退/跌破入场位离场`
- **动态回放**：`<KLinePlayback variant="line" title="财报后动量回放" />`（说明财报跳空缺口 + 后续惯性）
- **一笔交易的走读**：`<CaseWalk>`（setup 标记财报日 → signal 盈利超预期 + 放量 → entry 次日开盘入场 → manage 持有 2-4 周 → exit 动量衰减/止损 → review 抢跑风险）
- **入场规则**：盈利超预期（Surprise > 0）；公告次日不追高，等回调不破跳空缺口上沿；成交量放大
- **出场规则**：持有 2-4 周或动量衰竭；跌破跳空缺口/入场价止损
- **仓位管理**：单笔 1%-2%；事件类波动大，仓位减半
- **回测参考**（示意数据）：PEAD 效应在中小盘更强、衰减更快
- **适合/不适合**：✓ 财报数据及时完整的市场（美股/A股季报期）；✕ 无财报披露的品种、消息已提前泄露的高关注度股
- **常见误区**：追一字板（买不进/成本高）；把「超预期」当「必涨」（可能是市场已提前反应）；忽视财报日流动性
- **相关**：成交量分布、OBV、经济指标、止损策略

**Step 3: `docs/strategies/event-driven/index-rebalance.md`**（难度 挑战）

标题「指数调仓博弈策略（蹭指数买入量）」。结构：
- **一句话**：指数调整成分股时，被动基金必须在生效日集中买入新纳入的股票，提前埋伏吃这段「被动买盘」的确定性溢价。
- **PlainTalk**：把被动基金比作「照单点菜的大客户」——菜单一改，他必须在新菜单生效那天买入新菜，你提前把菜备好等着他。
- **核心逻辑 + SignalFlow**：`预告调仓 → 估算被动资金流入 → 提前埋伏 → 生效日附近卖出 → 错过则放弃`
- **动态回放**：`<KLinePlayback variant="line" title="纳入日前后回放" />`
- **一笔交易的走读**：`<CaseWalk>`
- **入场规则**：公告生效日期明确；估算被动买入额 > 标的日均成交额 5%；生效前 2-4 周埋伏
- **出场规则**：生效日或生效后 1-2 日兑现；跌破成本止损；公告取消立即离场
- **仓位管理**：事件确定性越高仓位越高（可 5%-10%）；单事件独立、不叠杠杆
- **回测参考**（示意数据）：纳入效应 / 剔除效应（剔除股被卖出）
- **适合/不适合**：✓ 有大型被动基金追踪的主流指数；✕ 冷门指数（资金流入太少）、已提前大涨的标的
- **常见误区**：生效日当天才追（买在别人出货点）；忽略「剔除」方向的做空难度（A股难做空）；把套利当投资（到期必须离场）
- **相关**：市场微观结构、ETF、组合风险管理

**Step 4: 验证**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链

**Step 5: Commit**
```bash
git add docs/strategies/event-driven/
git commit -m "feat: 新增事件驱动策略族（财报动量/指数调仓）"
```

---

## Task 4: 全站同步（侧边栏 / overview / index / code-examples / StrategyFit / 首页）

**Files:**
- Modify: `docs/.vitepress/config.ts`
- Modify: `docs/strategies/index.md`
- Modify: `docs/strategies/overview.md`
- Modify: `docs/strategies/code-examples.md`
- Modify: `docs/index.md`
- Modify: `docs/.vitepress/theme/components/StrategyFit.vue`
- Modify: `docs/.vitepress/theme/components/README.md`

**Step 1: config.ts** strategiesSidebar 在「量化进阶」块后追加两块：
```ts
  {
    text: '价值低估',
    collapsed: false,
    items: [
      { text: '低估值筛选', link: '/strategies/value/low-valuation' },
      { text: '高股息收息', link: '/strategies/value/dividend-yield' }
    ]
  },
  {
    text: '事件驱动',
    collapsed: false,
    items: [
      { text: '财报后动量', link: '/strategies/event-driven/earnings-drift' },
      { text: '指数调仓博弈', link: '/strategies/event-driven/index-rebalance' }
    ]
  }
```

**Step 2: `docs/strategies/index.md`** 策略分类表加两行：
```md
| [价值低估](./value/) | 便宜买好货 | [低估值筛选](./value/low-valuation) · [高股息收息](./value/dividend-yield) |
| [事件驱动](./event-driven/) | 事件改变定价 | [财报后动量](./event-driven/earnings-drift) · [指数调仓博弈](./event-driven/index-rebalance) |
```
「怎么选策略」决策树补两行：
```
├─ "便宜才是硬道理 / 想收息" → 价值低估
└─ "有明确催化剂（财报/调仓）" → 事件驱动
```

**Step 3: `docs/strategies/overview.md`**
- 「策略族对比」表追加两行：
```md
| [价值低估](../strategies/value/) | 便宜就是好买卖 | 估值修复 + 分红稳健 | 价值陷阱、长期不涨 | 长线（季-年） | 中 | 中 |
| [事件驱动](../strategies/event-driven/) | 事件改变定价 | 事件窗口爆发、平时空仓 | 事件落空、抢跑被埋 | 事件驱动（日-周） | 高 | 低-中 |
```
- 「5 个策略族在 6 种行情下」→「7 个策略族在 6 种行情下」
- 「别 18 个策略都学」→「别 22 个策略都学」
- 「怎么选策略（决策路径）」追加：
```
├─ 估值便宜 / 想要稳健分红 → 价值低估
└─ 有明确催化剂（财报/指数调仓）→ 事件驱动
```

**Step 4: `docs/strategies/code-examples.md`** 在「量化进阶」段后新增两段（每策略 6-10 行 Python 风格伪代码）：
```md
## 价值低估

### [低估值筛选](./value/low-valuation)
```python
for stock in universe:
    pe, pb = PE(stock), PB(stock)                 # 估值指标
    if pe < 15 and pb < 1.2 and roe(stock) > 10:  # 便宜 + 质量过滤
        candidates.append(stock)                  # 入候选池
buy_top(candidates, by='股息率', k=15)            # 等权买入前 15 只
# 分批建仓：估值分位 <20% 时加仓，修复到中枢减仓；基本面恶化无条件清仓
```

### [高股息收息](./value/dividend-yield)
```python
for stock in universe:
    yield = dividend(stock) / price(stock)        # 股息率
    ok = yield > 0.04 and payouts < 0.7 and free_cf(stock) > 0
    if ok: portfolio.append(stock)                # 股息率高 + 可持续
rebalance(monthly, dividend_reinvest=True)        # 红利再投资
# 股息率跌穿 3%（股价暴涨所致）→ 换到更高息标的；分红削减 → 清仓
```

## 事件驱动

### [财报后动量](./event-driven/earnings-drift)
```python
if today == earnings_date(stock) and surprise(stock) > 0 and VOL > 1.5 * MA(vol, 20):
    buy(risk=1.5%)                                # 超预期 + 放量，次日入场
elif has_position and (hold_days > 20 or close < entry - 0.5 * ATR(14)):
    sell_all()                                    # 惯性衰减 / 跌破缺口止损
# 不追一字板；只做「有足够流动性」的标的
```

### [指数调仓博弈](./event-driven/index-rebalance)
```python
if index_added(stock) and announced:              # 指数预告纳入
    inflow = estimate_passive_buy(stock)          # 估算被动资金
    if inflow > 0.05 * avg_daily_turnover(stock): # 买盘足够大
        buy(risk=5%, on=effective_date - 3w)      # 提前 3 周埋伏
if today >= effective_date:
    sell_all()                                    # 生效日附近兑现，到期必走
```
```

**Step 5: `docs/index.md`** 首页策略库 feature：`趋势跟踪 / 均值回归 / 动量 / 形态 / 量化五大策略族` → `趋势跟踪 / 均值回归 / 动量 / 形态 / 量化 / 价值 / 事件驱动七大策略族`

**Step 6: StrategyFit.vue** 在 `STRATEGIES` 数组尾部追加两行（纯数据）：
```ts
  {
    family: '价值低估',
    color: '#8d6e63',
    regimes: { 强趋势: 1, 弱趋势: 2, 震荡: 2, 高波动: 1, 低波动: 3, 恐慌暴跌: 1 },
    why: {
      强趋势: '强趋势里成长股领跑，「便宜」的票反而被资金抛弃。',
      弱趋势: '弱趋势中市场回到基本面定价，低估值标的开始被重新发现。',
      震荡: '震荡市没有趋势可追，估值/股息成为资金避风港。',
      高波动: '高波动阶段价值股防御性尚可，但估值修复往往被延后。',
      低波动: '低波动是价值/股息策略的甜区：没人炒热点，就看谁便宜、谁分红。',
      恐慌暴跌: '暴跌中「便宜」可以更便宜——价值陷阱，切勿接飞刀。'
    }
  },
  {
    family: '事件驱动',
    color: '#3949ab',
    regimes: { 强趋势: 2, 弱趋势: 3, 震荡: 3, 高波动: 2, 低波动: 2, 恐慌暴跌: 1 },
    why: {
      强趋势: '趋势市里事件只是趋势的中继，催化效果被放大但噪声也大。',
      弱趋势: '没有趋势可依赖时，财报/调仓等催化剂成为最清晰的交易依据。',
      震荡: '震荡市事件驱动与行情无关，靠事件的确定性单独获利。',
      高波动: '高波动下事件引发的缺口更大，机会与止损空间同步放大。',
      低波动: '低波动中事件买盘更容易推动价格，但提前埋伏的空间也小。',
      恐慌暴跌: '恐慌中事件全部失真，跳空风险大，不适合做事件埋伏。'
    }
  }
```
并在文件头注释补一句「已扩展至 7 族」。

**Step 7: `docs/.vitepress/theme/components/README.md`** StrategyFit 一节说明补：`矩阵含 7 个策略族（含 2026-08 新增的价值低估/事件驱动），仅覆盖「行情」维度；价值/事件族另有估值与事件维度，见策略总览表。`

**Step 8: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/.vitepress/config.ts docs/strategies/index.md docs/strategies/overview.md docs/strategies/code-examples.md docs/index.md docs/.vitepress/theme/components/StrategyFit.vue docs/.vitepress/theme/components/README.md
git commit -m "feat: 全站同步七大策略族（侧边栏/overview/首页/StrategyFit）"
```

---

## Task 5: 全量验证

**Step 1: 构建 + 死链**
Run: `npm run docs:build`；`node scripts/check-links.mjs`
Expected: 构建通过；0 死链

**Step 2: 浏览器实测（CLAUDE.md 强制）**
Run:
```bash
npm run docs:preview -- --port 4173
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --window-size=1400,2200 --virtual-time-budget=8000 --screenshot=/tmp/shots/donchian.png "http://localhost:4173/indicators/volatility/donchian"
```
依次截图：`/indicators/volatility/donchian`、`/strategies/value/`、`/strategies/value/low-valuation`、`/strategies/event-driven/index-rebalance`、`/strategies/overview`、`/`。用 CDP 抓 `Runtime.exceptionThrown` 确认无 JS 错误；检查 KLinePlayback 区域有 canvas、StrategyFit 表格有 7 行、PESim 组件正常渲染。

**Step 3: 分析截图**
对齐/溢出/留白检查；若无法直接读图，用 vision 工具或 PIL 裁剪放大。

**Step 4: 收尾 Commit（如有微调）**
