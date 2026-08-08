# ROC 动量指标补全实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐动量指标的 ROC（变动率指标，N 期价格百分比变化），新增 `calcROC` + KLinePlayback `roc` 模式（副窗格振荡器，0 轴参考线），新增入门指标页，并把全站 19 指标 → 20 指标的引用同步到位。

**Architecture:** 一处主题层改动（`calcROC` 纯函数 + KLinePlayback `roc` 模式，仿既有 `cmf`/`rsi` 副窗格模式），其余为内容层：1 个新指标页 + 侧边栏/索引/计数同步。

**Tech Stack:** VitePress 1.6、Vue 3、lightweight-charts v5、`lib/indicators.ts`、`KLinePlayback.vue`（`closes` 变量已在 `buildStrategy` 内可用）。

**验证（遵循 CLAUDE.md 强制流程）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图：验证 `/indicators/momentum/roc`，CDP 无 JS 错误、ROC 副窗格（pane 1）出现

**提交规范：** Conventional Commits，`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

## Task 1: 新增 calcROC + KLinePlayback roc 模式

**Files:**
- Modify: `docs/.vitepress/theme/lib/indicators.ts`（append `calcROC`）
- Modify: `docs/.vitepress/theme/components/KLinePlayback.vue`
- Modify: `docs/.vitepress/theme/components/README.md`

**Step 1: lib/indicators.ts** 在 `calcCMF` 之后追加：

```ts
/** ROC：变动率指标（Rate of Change），N 期价格的百分比变化，值域无界、围绕 0 波动 */
export function calcROC(closes: number[], period = 12): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null)
  for (let i = period; i < closes.length; i++) {
    const base = closes[i - period]
    out[i] = base !== 0 ? ((closes[i] - base) / base) * 100 : null
  }
  return out
}
```

**Step 2: KLinePlayback.vue** 三处：
- import 行加 `calcROC`
- strategy 联合类型末尾加 `| 'roc'`
- `case 'cmf'` 之后加（副窗格 + 0 轴参考线）：

```ts
    case 'roc': {
      return {
        lines: [{ name: 'ROC(12)', color: '#1e5fd0', values: calcROC(closes), pane: 1, priceLines: [0] }],
        markers: []
      }
    }
```

（`hasSubPane` 自动 +130px。）

**Step 3: README.md** 策略表 `cmf` 行后加：
```md
| `roc` | 子窗格 ROC(12)，带 0 轴参考线 | 无自动标注 |
```
并在注意第 5 条补 `calcROC`。

**Step 4: 验证 + Commit**
Run: `npm run docs:build`
Expected: 构建通过
```bash
git add docs/.vitepress/theme/lib/indicators.ts docs/.vitepress/theme/components/KLinePlayback.vue docs/.vitepress/theme/components/README.md
git commit -m "feat: 新增 calcROC 与 KLinePlayback roc 模式"
```

---

## Task 2: 新增 ROC 指标页

**Files:**
- Create: `docs/indicators/momentum/roc.md`

frontmatter `difficulty: 入门`。结构（仿 cmf/obv 页）：
- **一句话总结**：ROC = 价格 N 期涨跌幅百分比，衡量动量强弱的"温度计"——正=在涨、负=在跌，值越大动量越强。
- **PlainTalk**：把 ROC 比作"体重变化速度"——不是看体重多少，而是看这段时间瘦了多少/胖了多少；ROC 看的是"价格跑得多快"。
- **公式**：`ROC = (Cₜ − Cₜ₋ₙ) / Cₜ₋ₙ × 100`，N 默认 12。
- **关键参数**：周期 12（默认）｜与 RSI 区别（RSI 归一化到 0-100、ROC 无界）。
- **动态演示**：`<IndicatorDemo indicator="none" title="K 线 + 均线" />` + `<KLinePlayback strategy="roc" title="ROC 动量回放" />` + 图例表（ROC `#1e5fd0` 蓝，副窗格，0 轴）。
- **手把手算**（手动演算）：取 5 根价格算 ROC(2)、ROC(12) 各一例。
- **信号解读**：ROC 上穿 0 轴 = 转强；高位超买、低位超卖；顶/底背离；ROC 与价格同向创新高/低。
- **一次实战解读**：结合回放讲"价格新高 ROC 未新高 = 顶背离预警"。
- **实战用法**：动量确认、背离交易、与 RSI/MACD 共振、参数周期与持仓周期匹配。
- **常见误区**：不看周期匹配；把 ROC 超买当必然回调（强趋势里可钝化）；忽略离群值。
- **相关**：RSI、CCI、威廉指标、MACD。

**Step 2: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/indicators/momentum/roc.md
git commit -m "docs: 新增 ROC 变动率动量指标页"
```

---

## Task 3: 全站同步

**Files:**
- Modify: `docs/.vitepress/config.ts`（动量侧边栏加 1 项）
- Modify: `docs/indicators/momentum/index.md`（表格加 1 行）
- Modify: `docs/indicators/index.md`（动量分类表加 1 行）
- Modify: `docs/indicators/overview.md`（19→20，动量行补 ROC）

**Step 1: config.ts** momentum 侧边栏 `威廉指标` 后加：
```ts
      { text: 'ROC', link: '/indicators/momentum/roc' }
```

**Step 2: `docs/indicators/momentum/index.md`** 表格加行（ROC 入门，带徽章）+「怎么选」加一条。

**Step 3: `docs/indicators/index.md`** 动量分类表加行。

**Step 4: `docs/indicators/overview.md`**：「指标有 19 个」→「指标有 20 个」；动量行「RSI、KD、CCI、%R」→「RSI、KD、CCI、%R、ROC」。

**Step 5: 验证 + Commit**
Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 通过、0 死链
```bash
git add docs/.vitepress/config.ts docs/indicators/momentum/index.md docs/indicators/index.md docs/indicators/overview.md docs/plans/2026-08-08-roc-indicator.md
git commit -m "docs: 同步 ROC 到侧边栏与指标索引（19→20）"
```

---

## Task 4: 全量验证

**Step 1:** `npm run docs:build`；`node scripts/check-links.mjs` → 通过、0 死链

**Step 2: 浏览器实测**
Run: 确认 4173 空闲 → 起 preview → curl 等 200 → Edge headless 截图 `/indicators/momentum/roc`（`--user-data-dir=/tmp/edge-prof-roc`）→ vision 分析：标题/入门徽章、ROC 副窗格曲线围绕 0 轴、无溢出/乱码。

**Step 3: 收尾 Commit（如有微调）**
