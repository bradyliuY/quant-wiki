# 量化专家进阶体系设计

> 日期：2026-08-08
> 目标：把现有“量化知识库”从入门/中级学习站升级为“量化专家成长训练体系”。

## 一、设计结论

现有站点已经覆盖“看懂量化”和“跑通入门实战”：市场基础、指标、策略、方法论、案例、实战板块都已成型。下一阶段不应继续堆更多指标或策略，而应补齐专家能力：

1. 会提出策略假设，而不是只套规则
2. 会用统计方法判断结果是不是运气
3. 会识别参数优化和回测过拟合
4. 会做样本外验证与成本敏感性分析
5. 会把研究过程写成可复现报告
6. 会从研究、交易、工程三条路线继续深入

因此建议新增顶层板块：**专家进阶**。

该板块定位不是学术教材，而是“普通人也能跟着走的量化专家成长地图”：每个概念都要用大白话、生活类比、交易案例和小实验讲清楚。

---

## 二、总体框架：一体三线四阶段

### 一体：共同基础路线

所有读者先走同一条基础路径：

```text
市场基础 → K线/指标 → 策略 → 回测 → 风控 → 实战
```

这部分由现有 8 个板块承担，不重复建设。

### 三线：专家进阶方向

进入专家进阶后，按能力方向分为三条线：

| 路线 | 核心问题 | 目标能力 |
|------|----------|----------|
| 量化研究员 | 策略为什么赚钱？结果是不是运气？ | 提出假设、做验证、识别过拟合 |
| 系统化交易者 | 策略怎么执行、怎么拿得住？ | 控制成本、回撤、执行偏差与模拟盘复盘 |
| 量化开发者 | 研究流程怎么工程化？ | 数据清洗、项目结构、实验记录、可复现研究 |

### 四阶段：从读懂到专家

| 阶段 | 学习目标 | 对应能力 |
|------|----------|----------|
| 阶段 1：看懂市场 | 理解资产、K线、指标、策略 | 能读懂策略逻辑 |
| 阶段 2：写出策略 | 用规则表达入场/出场/风控 | 能把想法写成策略 |
| 阶段 3：验证策略 | 回测、样本外、过拟合检查 | 能判断策略是否可靠 |
| 阶段 4：形成闭环 | 研究报告、成本评估、模拟盘 | 能决定是否进入模拟盘 |

---

## 三、新板块结构

新增目录：

```text
docs/expert/
```

新增导航：

```ts
{ text: '专家进阶', link: '/expert/' }
```

侧边栏结构：

```text
专家进阶
├─ 专家成长地图
├─ 研究员路线
│  ├─ 策略假设：先问为什么会赚钱
│  ├─ 假设检验：结果是不是运气
│  ├─ 多重检验：参数扫多了总会碰巧
│  ├─ 样本外验证：换一段数据还灵吗
│  ├─ 过拟合识别：漂亮曲线最危险
│  └─ 研究报告模板
├─ 因子研究路线
│  ├─ 什么是因子
│  ├─ 单因子检验
│  ├─ 因子分层回测
│  ├─ 因子相关与冗余
│  ├─ 多因子组合
│  └─ 因子失效案例
├─ 系统化交易者路线
│  ├─ 交易成本
│  ├─ 滑点与成交偏差
│  ├─ 执行偏差
│  ├─ 策略组合
│  ├─ 回撤控制
│  └─ 模拟盘日志
├─ 量化开发者路线
│  ├─ 真实数据清洗
│  ├─ 数据质量检查
│  ├─ 回测项目结构
│  ├─ 实验记录
│  └─ 可复现研究流程
└─ 毕业项目
   ├─ 项目一：复现一个均线策略
   ├─ 项目二：复现一个动量因子
   ├─ 项目三：加入成本后的策略评估
   └─ 最终研究报告模板
```

---

## 四、第一批 MVP 范围

第一轮不一次性做完整 30+ 页，先做最能提升站点层级的 8 页：

```text
docs/expert/index.md
docs/expert/research-methods/index.md
docs/expert/research-methods/strategy-hypothesis.md
docs/expert/research-methods/multiple-testing.md
docs/expert/research-methods/out-of-sample.md
docs/expert/research-methods/overfitting.md
docs/expert/system-trading/trading-costs.md
docs/expert/capstone/final-report-template.md
```

### 为什么先做这 8 页

1. 立刻把站点从“知识库”升级为“训练体系”
2. 直接补齐专家化最大短板：假设、过拟合、样本外、成本、报告
3. 和现有 `practice/backtest-lab.md`、`methodology/backtesting/` 衔接自然
4. 工作量可控，验证成本低
5. 不新增复杂组件，主要复用现有内容层与组件

---

## 五、页面写作标准

专家进阶页统一采用“通俗解释 + 交易案例 + 小实验”的模板。

```md
# 页面标题

一句话：用一句大白话说明这个概念解决什么问题。

<PlainTalk>
生活类比：把抽象概念讲成人话。
</PlainTalk>

## 为什么重要

如果忽略它，会在量化研究或交易中犯什么错。

## 一个具体案例

用本站已有策略或指标举例，例如双均线、RSI、布林带、动量排名。

## 怎么判断

给判断规则、表格、公式或最小伪代码。

## 小实验

给读者一个能动手验证的小任务。

## 常见误区

- <span class="qw-no">✕</span> 错误做法
- <span class="qw-ok">✓</span> 正确做法

## 相关

链接到已有页面。
```

写作要求：

- 不堆术语，先讲“为什么你会踩坑”
- 每个抽象概念都配案例
- 公式只在必要时出现，并先解释直觉
- 继续标注“教学/示意”，避免真实投资建议
- 重点培养判断力，而不是背定义

---

## 六、第一批页面设计

### 1. `docs/expert/index.md` — 专家成长地图

目标：作为新板块总入口，告诉读者从哪里来、往哪里走。

核心内容：

- 说明“专家”不是知道更多指标，而是能验证、复盘、迭代
- 三条路线：研究员 / 系统化交易者 / 量化开发者
- 四阶段能力地图
- 推荐路径：
  - 新手：先完成现有入门与实战板块
  - 已会回测：从研究员路线开始
  - 已有交易经验：从交易成本与模拟盘日志开始
  - 程序员：从真实数据清洗与项目结构开始

案例：

> 同样是双均线策略，入门者问“金叉买吗”，专家问“为什么金叉应该有效、在哪些行情失效、换样本是否还成立、成本后是否还能赚钱”。

### 2. `docs/expert/research-methods/index.md` — 研究方法总览

目标：解释量化研究的完整流程。

流程：

```text
策略假设 → 数据准备 → 样本内验证 → 样本外验证 → 成本检查 → 失败场景 → 研究报告
```

核心观点：

- 回测不是为了证明自己对，而是为了找出什么时候会错
- 漂亮曲线不是终点，可靠解释才是起点
- 一份研究至少要回答：为什么赚钱、哪里会失效、是否值得模拟盘

### 3. `strategy-hypothesis.md` — 策略假设

目标：让读者先问“为什么会赚钱”，再写规则。

通俗解释：

> 策略假设就像开店前问“顾客为什么会来买”，而不是先装修门面。

案例：

- 双均线：趋势延续假设
- RSI 反转：短期过度恐慌后的修复假设
- 布林回归：震荡市价格围绕均值波动的假设

小实验：

让读者为一个策略补全三句话：

```text
这个策略赚的是谁的钱？
这个现象为什么会反复出现？
什么情况下它会失效？
```

### 4. `multiple-testing.md` — 多重检验

目标：解释“参数扫多了总会碰巧”。

通俗解释：

> 如果你买 1000 张彩票，总会有几张中小奖；但这不代表你发现了印钞机。

案例：

- 双均线快线 3–30，慢线 10–100
- 扫出一个年化很高的参数组合
- 换一段数据后失效

判断规则：

| 现象 | 风险 |
|------|------|
| 参数范围很宽 | 容易钓到噪声 |
| 最优参数孤零零一个点 | 不稳定 |
| 邻近参数表现差很多 | 大概率过拟合 |
| 换样本后排名大变 | 不可靠 |

小实验：

用 `BacktestLab` 点“找最优参数”，再点“换一段数据”，观察最优参数是否失效。

### 5. `out-of-sample.md` — 样本外验证

目标：解释“训练段赚钱，不代表未来赚钱”。

通俗解释：

> 考前把模拟卷答案背下来，不代表你真的会考试；换一张卷子才知道水平。

案例：

```text
2018–2021：用于找策略和调参数
2022：用于样本外验证
2023：用于模拟盘观察
```

内容重点：

- 样本内：允许研究和调参
- 样本外：只能验证，不能反复调
- 滚动验证：让策略经历更多市场环境

### 6. `overfitting.md` — 过拟合识别

目标：让读者警惕“漂亮曲线最危险”。

通俗解释：

> 过拟合就像按去年的天气定制一把伞：去年每场雨都挡住了，今年一出门就湿透。

典型信号：

- 曲线过于平滑
- 参数必须非常精确才赚钱
- 交易次数太少但收益很高
- 只在某一段行情有效
- 加一点成本就从盈利变亏损

案例：

双均线策略在某段趋势行情中扫出极高收益，但在震荡市频繁假信号。

### 7. `system-trading/trading-costs.md` — 交易成本

目标：把“纸面收益”和“真实可执行收益”区分开。

通俗解释：

> 交易成本像水管漏水：每次只漏一点，但高频开关水龙头，最后水桶可能是空的。

成本组成：

| 成本 | 说明 |
|------|------|
| 手续费 | 每笔固定或按金额收取 |
| 滑点 | 预期成交价与实际成交价的差 |
| 点差 | 买一卖一之间的天然差价 |
| 冲击成本 | 大单把价格推向不利方向 |

案例：

- 低频趋势策略：交易少，成本影响小
- 高频震荡策略：交易多，成本可能吃掉大部分利润

小实验：

给一个策略的单笔平均收益和交易次数，让读者计算扣成本后是否还赚钱。

### 8. `capstone/final-report-template.md` — 最终研究报告模板

目标：把专家能力沉淀成可复现输出。

报告结构：

```text
1. 策略假设
2. 数据范围
3. 信号规则
4. 回测规则
5. 成本假设
6. 样本内结果
7. 样本外结果
8. 风险与回撤
9. 失败场景
10. 是否进入模拟盘
```

核心要求：

- 不能只写“收益很好”
- 必须写“为什么可能失效”
- 必须写成本假设
- 必须写下一步是否进入模拟盘

---

## 七、后续扩展路线

### 第二批：因子研究路线

新增页面：

```text
docs/expert/factor-research/index.md
docs/expert/factor-research/what-is-factor.md
docs/expert/factor-research/single-factor-test.md
docs/expert/factor-research/factor-quantile.md
docs/expert/factor-research/factor-correlation.md
docs/expert/factor-research/multi-factor-model.md
docs/expert/factor-research/factor-decay.md
```

案例方向：

- 低估值因子：便宜股票是否长期更容易跑赢？
- 动量因子：过去强的资产未来是否继续强？
- 质量因子：高 ROE 公司是否更稳？

关联已有页面：

- `fundamentals/fundamental-analysis/valuation.md`
- `strategies/quantitative/factor-model.md`
- `methodology/statistics/correlation.md`
- `strategies/momentum/strength-ranking.md`

### 第三批：系统化交易者路线

新增页面：

```text
docs/expert/system-trading/slippage.md
docs/expert/system-trading/execution-gap.md
docs/expert/system-trading/strategy-portfolio.md
docs/expert/system-trading/drawdown-control.md
docs/expert/system-trading/paper-trading-journal.md
```

案例方向：

- 回测收盘价成交，模拟盘实际成交差 0.3%
- 两个单独赚钱的策略组合后回撤降低
- 高换手策略被成本吃掉 alpha

### 第四批：量化开发者路线

新增页面：

```text
docs/expert/quant-dev/index.md
docs/expert/quant-dev/data-cleaning.md
docs/expert/quant-dev/data-quality-check.md
docs/expert/quant-dev/backtest-project-structure.md
docs/expert/quant-dev/experiment-tracking.md
docs/expert/quant-dev/reproducible-research.md
```

案例方向：

- 真实行情缺失值如何处理
- 复权价格为什么影响回测
- survivorship bias 为什么会让股票池看起来更强
- 如何记录每次实验参数、数据范围和结果

### 第五批：毕业项目

新增页面：

```text
docs/expert/capstone/index.md
docs/expert/capstone/ma-strategy-report.md
docs/expert/capstone/momentum-factor-report.md
docs/expert/capstone/cost-aware-backtest.md
```

项目目标：

1. 复现一个均线策略
2. 复现一个动量因子
3. 加入成本后重新评估策略
4. 输出最终研究报告

---

## 八、组件策略

第一批不新增组件，复用现有组件：

| 组件 | 用途 |
|------|------|
| `PlainTalk` | 专家概念大白话解释 |
| `BacktestLab` | 参数优化、样本外、过拟合案例 |
| `ComparePanel` | 参数差异对比 |
| `ScoreMatrix` | 策略评估矩阵 |
| `CalcExplorer` | 期望值、风险收益比理解 |

后续可选新增两个组件：

### `OverfitDemo` 过拟合演示器

展示：

```text
扫参数 → 样本内曲线漂亮 → 样本外失效
```

建议放在：

- `multiple-testing.md`
- `overfitting.md`
- `out-of-sample.md`

### `CostImpact` 成本冲击演示器

展示手续费、滑点、换手率如何吃掉收益。

建议放在：

- `trading-costs.md`
- `slippage.md`
- `cost-aware-backtest.md`

---

## 九、内容边界

继续保持当前项目定位：

- 不提供具体股票推荐
- 不提供实时行情
- 不提供实盘交易指令
- 不编造真实股票价格或真实收益
- 示例数据必须标注教学/示意
- 真实数据只作为外部工具指引，不内置进站点
- 模拟盘仍是工具链终点

专家进阶不是鼓励实盘，而是提高读者识别风险、验证策略和避免过拟合的能力。

---

## 十、实施建议

### 第一阶段实施任务

1. 创建 `docs/expert/` 第一批 8 页
2. 修改 `docs/.vitepress/config.ts`，新增导航与侧边栏
3. 在以下页面补交叉链接：
   - `docs/practice/backtest-lab.md`
   - `docs/practice/index.md`
   - `docs/reference/reading-list.md`
   - `docs/methodology/backtesting/how-to-backtest.md`
   - `docs/methodology/backtesting/walk-forward.md`
4. 构建验证：`npm run docs:build`
5. 死链验证：`node scripts/check-links.mjs`
6. 浏览器验证专家进阶入口页与关键页面

### 推荐提交标题

```text
docs: 设计量化专家进阶体系
```

第一批内容实施可用：

```text
feat: 新增专家进阶板块 MVP
```

---

## 十一、成功标准

第一批完成后，站点应具备以下能力：

1. 新读者能看到“从入门到专家”的完整地图
2. 会回测的读者知道下一步该学样本外、过拟合和成本
3. 每个专家概念都有通俗解释和案例
4. 现有实战板块能自然导向专家进阶
5. 读者最终能按模板写出一份完整策略研究报告

这代表站点从“量化知识库”升级为“量化研究训练体系”。
