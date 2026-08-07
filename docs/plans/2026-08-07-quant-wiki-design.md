# 量化知识库设计文档

> 日期：2026-08-07
> 状态：已确认，进入实施

## 一、目标

构建一个**带动画的个人量化知识库**，基于 VitePress 静态站点，复用现有 quant-trading 技能的知识资产，从零补充指标、策略、金融基础等板块，通过 lightweight-charts 与 GSAP 实现动态行情图表和概念图解动画。

## 二、技术架构

```
VitePress 静态站点
├─ .vitepress/config.ts    导航 / 侧边栏 / 主题
├─ .vitepress/theme/       自定义 Vue 组件注册
├─ 动画引擎
│   ├─ lightweight-charts   → 动态K线/指标图（数据回放）
│   └─ GSAP + ScrollTrigger → 滚动触发概念动画
└─ 内容层 (Markdown + Vue 组件)
    docs/fundamentals/     金融基础
    docs/indicators/       指标大全
    docs/strategies/       策略库
    docs/methodology/      方法论
    docs/getting-started/  新手指南
    docs/reference/        参考
```

### 关键依赖
- **VitePress** — Vue 生态文档站，官方升级版 VuePress
- **lightweight-charts** (~45KB) — TradingView 官方开源库，金融图表
- **GSAP + ScrollTrigger** (~10KB) — 滚动触发动画

### 7 个可复用 Vue 组件
| ID | 组件名 | 技术 | 使用页面 |
|----|--------|------|----------|
| C1 | `KLinePlayback.vue` | lightweight-charts 时间推进 | 策略回放、案例复盘 |
| C2 | `IndicatorDemo.vue` | lightweight-charts 多窗口 | 指标页（K线+指标区） |
| C3 | `ComparePanel.vue` | 双图表实例同步 | 参数/指标/策略对比 |
| C4 | `CalcExplorer.vue` | GSAP 滚动驱动+交互 | 凯利公式、仓位计算 |
| C5 | `SignalFlow.vue` | GSAP 逐步点亮 | 策略信号流程图 |
| C6 | `PatternGrowth.vue` | lightweight-charts 逐根绘制 | 形态识别页 |
| C7 | `ScoreMatrix.vue` | GSAP + 雷达图 | 100分评分模型 |

## 三、内容架构

```
docs/
├── index.md                              # 首页 | 学习路径 + 分类导航 + 快速查找
├── fundamentals/                         # 🏛️ 金融基础（17页）
│   ├── index.md
│   ├── asset-classes/                    #   资产类别（股票/ETF/期货/期权/外汇/加密）
│   ├── fundamental-analysis/             #   基本面（三张表/估值/盈利/成长质量）
│   ├── macroeconomics/                   #   宏观经济（货币政策/经济指标/市场周期/地缘）
│   └── market-mechanics/                 #   市场机制（委托类型/交易时间/微观结构）
├── getting-started/                      # 🚀 新手指南（5页）
│   └── what-is-quant / market-basics / candlestick-101 / timeframes / first-strategy
├── indicators/                           # 📊 指标大全（17页，TradingView 分类）
│   ├── trend/                            #   趋势（MA/MACD/ADX/PSAR）
│   ├── momentum/                         #   动量（RSI/KD/CCI/WR）
│   ├── volatility/                       #   波动率（Boll/ATR/Keltner）
│   ├── volume/                           #   成交量（OBV/VP/MFI）
│   └── overlay/                          #   叠加（Ichimoku/枢轴点）
├── strategies/                           # 🎯 策略库（19页，QuantConnect 分类）
│   ├── trend-following/                  #   趋势跟踪（双均线/MACD/海龟/通道突破）
│   ├── mean-reversion/                   #   均值回归（布林/RSI/KD/配对）
│   ├── momentum/                         #   动量（双动量/RSI动量/强弱排名）
│   ├── pattern-trading/                  #   形态交易（双底/三角/头肩/旗形）
│   └── quantitative/                     #   量化进阶（多因子/网格/风险平价）
├── methodology/                          # 📐 方法论（15页，现有内容升级）
│   ├── scoring-model.md                  #   100分技术评分模型
│   ├── pattern-library/                  #   形态识别库（反转/中继/K线形态）
│   ├── risk-management/                  #   风险管理（凯利/仓位/止损/止盈/组合）
│   ├── backtesting/                      #   回测方法论（姿势/陷阱/指标/样本外）
│   └── trading-psychology/               #   交易心理（认知偏差/纪律/回撤心理）
└── reference/                            # 📚 参考
    ├── glossary.md                       #   术语词典
    ├── reading-list.md                   #   书单+学习路线
    └── about.md                          #   关于本站
```

**总计约 76 页面。**

## 四、页面模板标准

### 指标页模板（TradingView 式）
1. 一句话总结
2. 公式 + 参数表
3. **动态演示**（C2 IndicatorDemo）
4. 信号解读（金叉/死叉/背离）
5. 实战用法（如何结合其他指标）
6. 常见误区
7. 参数关系对比（C3）
8. 相关指标/策略交叉引用

### 策略页模板（QuantConnect 式）
1. 一句话概述
2. 策略逻辑流程图（C5 SignalFlow）
3. **动态回放**（C1 KLinePlayback，含累计收益曲线）
4. 入场/出场/止损规则
5. 回测参考数据表
6. 适合/不适合的市场
7. 参数变体对比（C3）
8. 代码示例
9. 关联指标

## 五、现有资产映射

| 现有文件 | 去向 | 处理 |
|----------|------|------|
| `technical-analysis.md` | `methodology/scoring-model.md` | 重写 + C7 |
| `risk-management.md` | `methodology/risk-management/` 5子页 | 拆分 + C4 |
| `pattern-library.md` | `methodology/pattern-library/` 3子页 + `strategies/pattern-trading/` 4策略页 | 方法归方法，策略归策略 + C6 |
| `us-stock-examples.md` | 各策略页案例小节 | 分散 |
| `china-a-stock-examples.md` | 同上 | 分散 |
| 15 workflows | strategies/ + methodology/ | 抽象为策略 |
| **全新编写** | fundamentals/ indicators/ strategies/ getting-started/ | 从零 |

## 六、开发节奏

| 阶段 | 范围 | 产出 |
|------|------|------|
| **Phase 1** 壳 | VitePress + 主题 + 首页 + 导航 + 7组件骨架 | 可运行站点框架 |
| **Phase 2** 指标 | indicators/ 17页 + C2/C3 完成 | 指标板块完工 |
| **Phase 3** 方法论 | methodology/ 现有重写 + C4/C6/C7 | 方法论板块完工 |
| **Phase 4** 策略 | strategies/ 19页 + C1/C5 | 策略板块完工 |
| **Phase 5** 新手+金融基础 | getting-started/ + fundamentals/ | 入口路径完工 |
| **Phase 6** 收尾 | 交叉引用 + 搜索 + 部署 | 全站上线 |

## 七、不纳入范围

- 具体股票推荐/实时行情（知识库定位）
- 编程语言教程（只放策略代码片段）
- 监管合规（只声明"不构成投资建议"）
