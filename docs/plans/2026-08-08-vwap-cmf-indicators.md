# VWAP / CMF 指标补全实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐成交量指标的 VWAP（已支持渲染，仅缺页面）与 CMF（需新增计算 + 图表模式），各加一个入门/进阶指标页，并把全站 17 指标 → 19 指标的引用同步到位。页面沿用「一句话 → 大白话 → 公式 → 参数 → 动态演示 → 手把手算 → 信号解读 → 实战 → 常见误区 → 相关」模板，面向小白。

**Architecture:** 一处主题层改动（新增 `calcCMF` 纯函数 + KLinePlayback 的 `cmf` 策略模式，完全仿照既有 `obv` 模式），其余为内容层：2 个新指标页 + 侧边栏/索引/计数同步。

**Tech Stack:** VitePress 1.6、Vue 3、lightweight-charts v5、`lib/indicators.ts`（`calcVWAP` 已存在）、`KLinePlayback.vue`（`vwap` 模式已存在，`obv` 模式为 `cmf` 的模板）。

**验证（遵循 CLAUDE.md 强制流程）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：验证 `/indicators/volume/vwap` 与 `/indicators/volume/cmf`，CDP 无 JS 错误、KLinePlayback 的 canvas 渲染、CMF 副窗格（pane 1）出现

**提交规范：** Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

## Task 1: 新增 calcCMF + KLinePlayback cmf 模式

**Files:**
- Modify: `docs/.vitepress/theme/lib/indicators.ts`（append `calcCMF`）
- Modify: `docs/.vitepress/theme/components/KLinePlayback.vue`
- Modify: `docs/.vitepress/theme/components/README.md`（策略表 + lib 注记）

**Step 1: lib/indicators.ts** 在 `calcVWAP`（约 line 324）之后追加：

```ts
/** CMF：蔡金资金流（Chaikin Money Flow），量价综合的强弱振荡指标，值域约 [-1, 1] */
export function calcCMF(data: OHLC[], period = 20): (number | null)[] {
  const out: (number | null)[] = data.map(() => null)
  let sumMFV = 0
  let sumVol = 0
  for (let i = 0; i < data.length; i++) {
    const { high, low, close } = data[i]
    const vol = data[i].volume ?? 0
    const range = high - low
    // 无量 / 无振幅时 MFM 记 0（既非流入也非流出）
    const mfm = range > 0 ? (close - low - (high - close)) / range : 0
    sumMFV += mfm * vol
    sumVol += vol
    if (i >= period - 1) {
      out[i] = sumVol > 0 ? sumMFV / sumVol : 0
      // 滑出窗口最旧一根
      const j = i - period + 1
      const r0 = data[j].high - data[j].low
      const mfm0 = r0 > 0 ? (data[j].close - data[j].low - (data[j].high - data[j].close)) / r0 : 0
      sumMFV -= mfm0 * (data[j].volume ?? 0)
      sumVol -= data[j].volume ?? 0
    }
  }
  return out
}
```

**Step 2: KLinePlayback.vue** 三处：
- import 行（line 4）加 `calcCMF`：`... calcPivot, calcVWAP, calcCMF, type OHLC`
- strategy 联合类型（line 21）末尾加 `| 'cmf'`
- `case 'vwap'` 之后加（完全仿 `obv`，pane 1 副窗格）：

```ts
    case 'cmf': {
      return {
        lines: [{ name: 'CMF', color: '#1e5fd0', values: calcCMF(data), pane: 1 }],
        markers: []
      }
    }
```

（`hasSubPane` / `chartHeight` 会自动 +130px，无需额外处理。）

**Step 3: README.md** 策略表 `vwap` 行后加一行：
```md
| `cmf` | 子窗格 CMF（蔡金资金流），值域 ±1 | 无自动标注 |
```
并在「注意」第 5 条补充：`lib/indicators.ts` 新增 `calcCMF`，供 KLinePlayback 的 `cmf` 模式使用。

**Step 4: 验证 + Commit**
Run: `npm run docs:build`
Expected: 构建通过
```bash
git add docs/.vitepress/theme/lib/indicators.ts docs/.vitepress/theme/components/KLinePlayback.vue docs/.vitepress/theme/components/README.md
git commit -m "feat: 新增 calcCMF 与 KLinePlayback cmf 模式"
```

---

## Task 2: 新增 VWAP 指标页

**Files:**
- Create: `docs/indicators/volume/vwap.md`

frontmatter `difficulty: 入门`。结构（仿 obv.md）：
- **一句话总结**：VWAP = 成交量为权重的加权平均价，是当日资金的"平均成本线"，机构日内参照物。
- **PlainTalk**：把 VWAP 比作"当天平均成本线"——早盘买了多少、什么价位买的加权平均，价格在线上=持筹者平均在赚、线下=平均在亏。
- **公式**：`VWAP = Σ(典型价 × 成交量) / Σ(成交量)`，典型价 = (H+L+C)/3；从开盘累计。
- **关键参数**：周期=日内累计（无参数）｜对比盘口支撑压力｜与 MA 区别（VWAP 带量、MA 纯价格）。
- **动态演示**：`<IndicatorDemo indicator="none" title="K 线 + 均线" />` + `<KLinePlayback strategy="vwap" title="VWAP 成交量重心回放" />` + 图例表（VWAP `#e69138` 橙）。
- **手把手算**（无 CalcDemo 模式，手动演算）：取前 3 根 K 线，算典型价、加权累计：
```
第 1 天  H/L/C = 102/99/101，量 100 → 典型价 = 100.67，PV = 10067，VWAP = 100.67
第 2 天  典型价 103.5，量 150 → 累计 PV = 10067 + 15525，累计量 250 → VWAP = 102.37
...
```
- **信号解读**：价格站上/跌破 VWAP = 日内多空分界；VWAP 附近是机构的挂单支撑/压力。
- **一次实战解读**：结合回放讲"开盘贴 VWAP、放量突破、回踩 VWAP 支撑"。
- **实战用法**：日内交易锚、均值回归（偏离 VWAP 过大回归）、与布林带/量价配合。
- **常见误区**：VWAP 是日内指标（跨日无意义）；不是预测线是成本线；单日数据在长周期图无意义。
- **相关**：OBV、MFI、成交量分布、ATR。

**Step 2: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/indicators/volume/vwap.md
git commit -m "docs: 新增 VWAP 成交量加权均价指标页"
```

---

## Task 3: 新增 CMF 指标页

**Files:**
- Create: `docs/indicators/volume/cmf.md`

frontmatter `difficulty: 进阶`。结构（仿 obv.md）：
- **一句话总结**：CMF 用"收盘位置在当日高低点区间的位置"结合成交量，衡量资金流入/流出强度，值域约 ±1，正=资金流入、负=流出。
- **PlainTalk**：把 CMF 比作"资金的潮汐表"——收盘越靠近当日最高、量越大，说明买盘把价格推在高处，是涨潮（流入）；收盘越靠最低、量越大，是退潮（流出）。
- **公式**：
```
MFM = [(C−L) − (H−C)] / (H−L)
MFV = MFM × 成交量
CMF = ΣMFV(N期) / Σ成交量(N期)     // N 默认 20
```
- **关键参数**：周期 20（默认）；与 MFI 区别（MFI 用典型价、CMF 用收盘位置；两者都属量价流）。
- **动态演示**：`<IndicatorDemo indicator="none" title="K 线 + 均线" />` + `<KLinePlayback strategy="cmf" title="CMF 资金流回放" />` + 图例表（CMF `#1e5fd0` 蓝，副窗格，0 轴上下）。
- **手把手算**（手动演算）：给 3 根 K 线算 MFM、MFV、滚动 CMF。
- **信号解读**：CMF > 0 且上行 = 持续流入；< 0 = 流出；顶背离（价新高 CMF 未新高）；0 轴穿越。
- **一次实战解读**：结合回放讲"放量上攻 CMF 冲高、价新高 CMF 钝化=动能减弱"。
- **实战用法**：确认突破（CMF 同步转正）、背离预警、与 OBV/RSI 共振。
- **常见误区**：只看正负不看斜率；忽略极端量；与 MFI 混淆（一个用收盘位置、一个用典型价）。
- **相关**：OBV、MFI、成交量分布、RSI。

**Step 2: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/indicators/volume/cmf.md
git commit -m "docs: 新增 CMF 蔡金资金流指标页"
```

---

## Task 4: 全站同步（侧边栏 / 索引 / overview 计数）

**Files:**
- Modify: `docs/.vitepress/config.ts`（成交量侧边栏加 2 项）
- Modify: `docs/indicators/volume/index.md`（表格加 2 行）
- Modify: `docs/indicators/index.md`（成交量分类表加 2 行）
- Modify: `docs/indicators/overview.md`（「指标有 17 个」→19，成交量行补 VWAP/CMF）

**Step 1: config.ts** volume 侧边栏 `MFI` 后加：
```ts
      { text: 'VWAP', link: '/indicators/volume/vwap' },
      { text: 'CMF', link: '/indicators/volume/cmf' }
```

**Step 2: `docs/indicators/volume/index.md`** 表格加 2 行（VWAP 入门、CMF 进阶，带徽章）+「怎么选」各加一条。

**Step 3: `docs/indicators/index.md`** 成交量分类表加 2 行。

**Step 4: `docs/indicators/overview.md`**：「指标有 17 个」→「指标有 19 个」；五大分类回顾表成交量行「OBV、MFI、成交量分布」→「OBV、MFI、VWAP、CMF、成交量分布」。

**Step 5: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/.vitepress/config.ts docs/indicators/volume/index.md docs/indicators/index.md docs/indicators/overview.md
git commit -m "docs: 同步 VWAP/CMF 到侧边栏与指标索引"
```

---

## Task 5: 全量验证

**Step 1: 构建 + 死链**
Run: `npm run docs:build`；`node scripts/check-links.mjs`
Expected: 通过；0 死链

**Step 2: 浏览器实测**
Run: 先确认 4173 端口空闲（`netstat -ano | grep 4173`），再 `npm run docs:preview -- --port 4173`，`curl` 等 200；然后：
```bash
MSEDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
"$MSEDGE" --headless=new --disable-gpu --user-data-dir=/tmp/edge-prof-vwap --window-size=1400,2400 --virtual-time-budget=10000 --screenshot=/tmp/shots/vwap.png "http://localhost:4173/indicators/volume/vwap"
"$MSEDGE" --headless=new --disable-gpu --user-data-dir=/tmp/edge-prof-cmf --window-size=1400,2400 --virtual-time-budget=10000 --screenshot=/tmp/shots/cmf.png "http://localhost:4173/indicators/volume/cmf"
```
用 vision 工具分析：标题/徽章、canvas 图表渲染、CMF 副窗格出现、无溢出/乱码。

**Step 3: 收尾 Commit（如有微调）**
