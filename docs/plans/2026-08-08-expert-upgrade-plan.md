# 量化专家进阶板块 MVP 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 按 `2026-08-08-expert-upgrade-design.md` 第一批 MVP，新增顶层「专家进阶」板块 8 页，把站点从“量化知识库”升级为“量化研究训练体系”。

**Architecture:** 全部为内容层 + 站点配置改动。第一批不新增 Vue 组件，复用现有全局组件 `PlainTalk`、`BacktestLab`、`CalcExplorer` 等；新增目录 `docs/expert/`，并在 `docs/.vitepress/config.ts` 新增 nav 与 sidebar 映射。交叉链接从实战、回测方法论、书单导向专家进阶。

**Content Style:** 新手友好、案例驱动、通俗解释。每页采用“问题 → 类比 → 案例 → 判断方法 → 小实验 → 常见误区 → 相关”的结构。所有收益、数据、案例都标注为教学/示意，不构成投资建议。

**Tech Stack:** VitePress 1.6、Markdown、Vue 全局组件；无后端、无测试套件。

**验证流程（遵守 CLAUDE.md）：**
1. `npm run docs:build` 通过
2. `node scripts/check-links.mjs` 输出 0 死链
3. `npm run docs:preview -- --port 4173` + Edge headless 截图验证 `/expert/`、`/expert/research-methods/multiple-testing`、`/expert/research-methods/out-of-sample`、`/expert/system-trading/trading-costs`、`/expert/capstone/final-report-template`
4. 检查页面排版：表格不溢出、代码块可读、PlainTalk 渲染正常、BacktestLab 链接正确

**提交规范：** Conventional Commits，项目当前 CLAUDE.md 要求提交含 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`；若当前会话模型政策需要不同署名，按仓库指令优先。

---

## Task 1: 创建专家进阶目录与首页

**Files:**
- Create: `docs/expert/index.md`

**Step 1: 创建 `docs/expert/index.md`**

内容结构：

```md
---
title: 专家进阶
---

# 专家进阶

一句话：专家不是知道更多指标，而是能提出假设、验证策略、识别过拟合，并决定一个策略是否值得进入模拟盘。

<PlainTalk>...</PlainTalk>

## 为什么新增这个板块

现有板块帮你完成“看懂”和“做出来”；专家进阶帮你回答“这个结果可靠吗”。

## 一体三线四阶段

表格展示：共同基础 + 研究员/系统化交易者/量化开发者 + 四阶段。

## 三条专家路线

### 量化研究员路线
...
### 系统化交易者路线
...
### 量化开发者路线
...

## 推荐路径

| 你现在的状态 | 下一步 |
...

## 一个例子：双均线策略的专家问法

从“金叉买吗”升级到“为什么有效、何时失效、换样本是否成立、成本后是否赚钱”。

## 相关

- [实战板块](../practice/)
- [回测实验室](../practice/backtest-lab)
- [回测的正确流程](../methodology/backtesting/how-to-backtest)
```

**Step 2: 构建验证**

Run: `npm run docs:build`
Expected: 构建通过。此时页面尚未进 nav/sidebar，不跑死链。

---

## Task 2: 创建研究方法路线 5 页

**Files:**
- Create: `docs/expert/research-methods/index.md`
- Create: `docs/expert/research-methods/strategy-hypothesis.md`
- Create: `docs/expert/research-methods/multiple-testing.md`
- Create: `docs/expert/research-methods/out-of-sample.md`
- Create: `docs/expert/research-methods/overfitting.md`

> **后记（2026-08-08 增补）**：MVP 之外新增 `docs/expert/research-methods/reading-research-reports.md`（研报批判性阅读）——教从券商研报里提炼假设、查证据、辨陷阱、判可复现，作为研究员路线的实战应用页，已接入 sidebar 与 research-methods 总览。

### Step 1: `research-methods/index.md`

frontmatter: `title: 研究方法总览`、`difficulty: 挑战`

核心内容：

```md
# 研究方法总览

一句话：量化研究不是找一条漂亮曲线，而是证明一个策略在什么条件下可能有效、在什么条件下会失效。

<PlainTalk>...</PlainTalk>

## 量化研究流程

策略假设 → 数据准备 → 样本内验证 → 样本外验证 → 成本检查 → 失败场景 → 研究报告

## 每一步问什么

表格：步骤 / 要问的问题 / 对应页面。

## 好研究和坏研究的区别

对比表。

## 相关

- [策略假设](./strategy-hypothesis)
- [多重检验](./multiple-testing)
- [样本外验证](./out-of-sample)
- [过拟合识别](./overfitting)
- [最终研究报告模板](../capstone/final-report-template)
```

### Step 2: `strategy-hypothesis.md`

frontmatter: `title: 策略假设`、`difficulty: 进阶`

重点：先问为什么会赚钱。

案例：

| 策略 | 背后假设 | 可能失效 |
|------|----------|----------|
| 双均线 | 趋势会延续 | 震荡市反复打脸 |
| RSI 反转 | 短期恐慌会修复 | 单边下跌越跌越弱 |
| 布林回归 | 价格围绕均值波动 | 趋势突破后不回头 |

小实验：给任意策略补全三句话：赚谁的钱、现象为何重复、何时失效。

### Step 3: `multiple-testing.md`

frontmatter: `title: 多重检验`、`difficulty: 挑战`

重点：参数扫多了总会碰巧。

必须包含：

- 彩票类比
- 双均线参数扫描案例
- “最优参数孤岛”判断表
- 小实验：在 [回测实验室](../../practice/backtest-lab) 找最优参数后换一段数据
- 相关链接到 `BacktestLab`、`walk-forward`、`overfitting`

### Step 4: `out-of-sample.md`

frontmatter: `title: 样本外验证`、`difficulty: 挑战`

重点：训练段赚钱，不代表未来赚钱。

必须包含：

- 考试类比
- 样本内/样本外/模拟盘三段划分表
- 时间切分示例：2018–2021 研究，2022 验证，2023 模拟观察（标注示意）
- 规则：样本外只能验证，不能反复调参
- 滚动验证解释

### Step 5: `overfitting.md`

frontmatter: `title: 过拟合识别`、`difficulty: 挑战`

重点：漂亮曲线最危险。

必须包含：

- 天气定制雨伞类比
- 过拟合五个信号：参数精确、交易太少、只在一段行情有效、成本一加就亏、邻近参数差很多
- 双均线趋势段成功、震荡段失败案例
- 检查清单

**Step 6: 构建验证**

Run: `npm run docs:build`
Expected: 构建通过。

---

## Task 3: 创建系统化交易者成本页

**Files:**
- Create: `docs/expert/system-trading/trading-costs.md`

**Step 1: 创建页面**

frontmatter: `title: 交易成本`、`difficulty: 进阶`

内容结构：

```md
# 交易成本

一句话：回测里的收益是纸面收益，扣掉手续费、滑点、点差和冲击成本后，才接近真实可执行收益。

<PlainTalk>水管漏水类比...</PlainTalk>

## 成本有哪些

表格：手续费 / 滑点 / 点差 / 冲击成本。

## 为什么高换手最怕成本

案例：低频趋势策略 vs 高频震荡策略。

## 一个示意计算

100 笔交易，单笔平均收益 0.25%，单边成本 0.08%，来回 0.16%，扣后只剩 0.09%。

## 怎么在研究报告里写成本假设

模板。

## 小实验

改不同成本假设，观察策略是否仍为正期望。

## 常见误区

...

## 相关

- [模拟盘实操](../../practice/paper-trading)
- [回测实验室](../../practice/backtest-lab)
- [最终研究报告模板](../capstone/final-report-template)
```

**Step 2: 构建验证**

Run: `npm run docs:build`
Expected: 构建通过。

---

## Task 4: 创建毕业项目报告模板

**Files:**
- Create: `docs/expert/capstone/final-report-template.md`

**Step 1: 创建页面**

frontmatter: `title: 最终研究报告模板`、`difficulty: 挑战`

内容结构：

```md
# 最终研究报告模板

一句话：一份合格的量化研究报告，不是证明策略赚钱，而是说明它为什么可能赚钱、在哪里会失效、是否值得进入模拟盘。

<PlainTalk>体检报告类比...</PlainTalk>

## 报告结构

10 项：策略假设、数据范围、信号规则、回测规则、成本假设、样本内结果、样本外结果、风险回撤、失败场景、是否进入模拟盘。

## 可复制模板

用 Markdown 代码块给完整模板。

## 一个简短示例：双均线策略

用示意字段填一小段。

## 评分表

| 项目 | 合格标准 |
...

## 常见误区

...

## 相关

- [策略假设](../research-methods/strategy-hypothesis)
- [样本外验证](../research-methods/out-of-sample)
- [交易成本](../system-trading/trading-costs)
```

**Step 2: 构建验证**

Run: `npm run docs:build`
Expected: 构建通过。

---

## Task 5: 注册导航与侧边栏

**Files:**
- Modify: `docs/.vitepress/config.ts`

**Step 1: 读取 config.ts，定位 nav 与 sidebar 定义**

Use Read on `docs/.vitepress/config.ts`。

**Step 2: 新增 expertSidebar**

在其他 sidebar 常量附近加入：

```ts
const expertSidebar: DefaultTheme.SidebarItem[] = [
  { text: '专家成长地图', link: '/expert/' },
  {
    text: '研究员路线',
    collapsed: false,
    items: [
      { text: '研究方法总览', link: '/expert/research-methods/' },
      { text: '策略假设', link: '/expert/research-methods/strategy-hypothesis' },
      { text: '多重检验', link: '/expert/research-methods/multiple-testing' },
      { text: '样本外验证', link: '/expert/research-methods/out-of-sample' },
      { text: '过拟合识别', link: '/expert/research-methods/overfitting' }
    ]
  },
  {
    text: '系统化交易者路线',
    collapsed: false,
    items: [{ text: '交易成本', link: '/expert/system-trading/trading-costs' }]
  },
  {
    text: '毕业项目',
    collapsed: false,
    items: [{ text: '最终研究报告模板', link: '/expert/capstone/final-report-template' }]
  }
]
```

**Step 3: nav 新增入口**

在 `实战` 或 `参考` 附近加入：

```ts
{ text: '专家进阶', link: '/expert/' },
```

建议放在 `实战` 后、`参考` 前。

**Step 4: sidebar 映射新增**

```ts
'/expert/': expertSidebar,
```

**Step 5: 验证**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链。

---

## Task 6: 补交叉链接

**Files:**
- Modify: `docs/practice/index.md`
- Modify: `docs/practice/backtest-lab.md`
- Modify: `docs/reference/reading-list.md`
- Modify: `docs/methodology/backtesting/how-to-backtest.md`
- Modify: `docs/methodology/backtesting/walk-forward.md`

**Step 1: `practice/index.md`**

在相关或路线结尾加：

```md
- 进阶路线：[专家进阶](../expert/) —— 学会样本外、过拟合、成本和研究报告
```

**Step 2: `practice/backtest-lab.md`**

在“下一步”或“相关”加：

```md
- 专家进阶：[多重检验](../expert/research-methods/multiple-testing) 与 [过拟合识别](../expert/research-methods/overfitting)
```

**Step 3: `reference/reading-list.md`**

在学习路径图第四阶段后加第五阶段：

```text
第五阶段：专家进阶（持续）
  [专家成长地图](../expert/) → [研究方法总览](../expert/research-methods/) → [最终研究报告模板](../expert/capstone/final-report-template)
```

并在“学习建议”增加一条：

```md
6. **每个策略都写研究报告**：先问假设，再看样本外和成本，不要只看收益曲线
```

**Step 4: `how-to-backtest.md`**

相关小节追加：

```md
- 专家进阶：[样本外验证](../../expert/research-methods/out-of-sample)、[过拟合识别](../../expert/research-methods/overfitting)
```

注意路径相对 `docs/methodology/backtesting/how-to-backtest.md` 是 `../../expert/...`。

**Step 5: `walk-forward.md`**

相关小节追加：

```md
- 专家进阶：[样本外验证](../../expert/research-methods/out-of-sample)
```

**Step 6: 验证**

Run: `npm run docs:build` && `node scripts/check-links.mjs`
Expected: 构建通过；0 死链。

---

## Task 7: 全量浏览器验证

**Step 1: 启动预览**

Run:

```bash
npm run docs:preview -- --port 4173
```

如 4173 被占用且返回旧内容，换 4174。

**Step 2: 截图页面**

用 Edge headless 截图以下页面：

```text
/expert/
/expert/research-methods/multiple-testing
/expert/research-methods/out-of-sample
/expert/research-methods/overfitting
/expert/system-trading/trading-costs
/expert/capstone/final-report-template
```

检查：

- 页面渲染正常
- nav 有“专家进阶”
- sidebar 分组正确
- PlainTalk 正常渲染
- 表格不横向溢出
- 代码块可读
- 链接点击路径正确

如无法直接判断截图，用 vision skill 的外部视觉脚本分析截图。

**Step 3: 完成提交**

仅在用户要求提交时执行 git commit。推荐提交：

```bash
git add docs/expert/ docs/.vitepress/config.ts docs/practice/index.md docs/practice/backtest-lab.md docs/reference/reading-list.md docs/methodology/backtesting/how-to-backtest.md docs/methodology/backtesting/walk-forward.md docs/plans/2026-08-08-expert-upgrade-design.md docs/plans/2026-08-08-expert-upgrade-plan.md
git commit -m "feat: 新增专家进阶板块 MVP"
```

Commit body include:

```text
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```
