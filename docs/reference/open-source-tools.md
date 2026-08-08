---
title: 开源工具推荐
---

# 开源工具推荐

## 一句话定位

概念层教「看懂」、[实战板块](../practice/)教「做出来」——这份清单是「做出来」路上经过验证的**开源工具与资料**，按实战板块的学习阶段排序，避免一站收集一堆、最后全吃灰。

## 怎么用这份清单

1. **对齐实战板块的路线**：先玩 → 接真数据 → 第一个回测 → 绩效分析 → 模拟盘
2. **每个阶段只挑 1 个深入**，别同时开 3 个框架
3. **先确认维护状态**：点进 GitHub 看最近提交与 Issue 活跃度——这行工具停更很快（backtrader 就是例子），2026 年用之前务必核实

> 以下所有工具都是开源或免费可用的教学向选择，与本站立场一致：**推荐到模拟盘为止**，不涉及实盘下单。

## 阶段① 先玩（浏览器零配置，接「回测实验室」之后）

概念上你已经会在[回测实验室](../practice/backtest-lab)里拧参数了，下一步把这些套路搬到**真实数据**上：

| 工具 | 一句话 | 适合 |
|------|--------|------|
| [聚宽 JoinQuant](https://www.joinquant.com) | 中文云端研究平台，自带数据、浏览器直接回测 | 想跳过装环境、专注策略本身 |
| [米筐 RiceQuant](https://www.ricequant.com) | 同类中文平台，社区有大量现成策略可读 | 想读别人怎么写策略 |
| [QuantConnect](https://www.quantconnect.com) | 国际化平台，Learning Center 免费课程系统 | 英文 OK、想要课程化引导 |

## 阶段② 接真数据（数据处理与指标，接「pandas 数据处理」之后）

[实战板块](../practice/pandas-basics)教了 pandas 三步清洗，这里是指标层的提速器：

| 工具 | 一句话 |
|------|--------|
| [Pandas TA](https://github.com/twopirllc/pandas-ta) | 一行算几十个指标，比手写 `rolling()` 高效，是 pandas 页之后的自然接力 |
| [finta](https://github.com/peerchemist/finta) | 极轻量指标库，代码短、可读性好，适合读源码理解指标是怎么实现的 |
| [OpenBB](https://github.com/OpenBB-finance/OpenBB) | 开源投资研究终端，聚合行情/宏观/基本面数据，写策略前的「看数据」环节 |

## 阶段③ 第一个回测（框架升级，接「第一个回测」之后）

[用回测框架跑通第一个策略](../practice/first-backtest)讲的是 backtrader，后面可以这样升级：

| 工具 | 一句话 |
|------|--------|
| [backtesting.py](https://github.com/kernc/backtesting.py) | 教学最友好：几十行跑通、自带绘图、没有事件循环的概念负担，比 backtrader 更适合入门 |
| [zipline-reloaded](https://github.com/stefan-jansen/zipline-reloaded) | 经典事件驱动框架的社区续作，学「策略作为独立对象」的工业写法 |
| [Qlib（微软）](https://github.com/microsoft/qlib) | 想走**机器学习量化**的话，这是一站式平台（数据/因子/模型/回测） |

## 阶段④ 绩效分析（回测之后真正该做的验证）

「跑出曲线」只是开始，这一层回答「曲线到底靠不靠谱」——直接回应本站反复强调的**过拟合**：

| 工具 | 一句话 |
|------|--------|
| [pyfolio-reloaded](https://github.com/stefan-jansen/pyfolio-reloaded) | 资金曲线/回撤/滚动夏普，一键出专业绩效报告 |
| [alphalens-reloaded](https://github.com/stefan-jansen/alphalens-reloaded) | 因子 IC / 分层回测——用数据量化「参数是不是在拟合噪声」 |
| [empyrical](https://github.com/quantopian/empyrical) | 轻量风险指标库，可作回测引擎指标卡的参照实现 |

## 阶段⑤ 模拟盘（本站工具链的终点，接「模拟盘实操」之后）

- **[Alpaca](https://alpaca.markets)**：免费 API + 美股模拟盘，可把你写的回测策略接成**自动 paper trading**——是工具链终点最顺的下一步
- TradingView / IBKR Paper：见 [模拟盘实操](../practice/paper-trading)，已在站内说明

再往前是实盘执行（真实资金、API 密钥、合规），超出本站定位，详见 [Python 环境与数据获取](../practice/python-setup) 的「实盘延伸」。

## 学习资料

| 资料 | 一句话 |
|------|--------|
| [QuantStart](https://www.quantstart.com) | 系统性教学文章，从回测到事件驱动一步步来 |
| [Quantopian 课程存档](https://github.com/quantopian/research_public) | 平台已关，但当年免费课程讲稿仍是经典教材 |
| [WorldQuant《101 Formulaic Alphas》](https://arxiv.org/abs/1601.00991) | 101 个可复现代数表达式因子，因子挖掘入门 |
| 《Systematic Trading》Robert Carver | 从零搭一个完整交易系统的实作指南 |
| 《Advances in Financial Machine Learning》López de Prado | 机器学习 + 回测陷阱，进阶必读 |

书单完整版在 [推荐书单与学习路线](./reading-list)。

## 常见误区

- <span class="qw-no">✕</span> 一次收藏十个框架：每个只试了三分钟，等于全没学
- <span class="qw-no">✕</span> 不看维护状态就上手：装完发现依赖全坏，先看 GitHub 活跃度
- <span class="qw-ok">✓</span> 每个阶段挑一个，跑通一个再换下一个

## 相关

- 动手入口：[实战板块](../practice/)
- 学习路线：[推荐书单与学习路线](./reading-list)
- 站点边界：[关于本站](./about)
