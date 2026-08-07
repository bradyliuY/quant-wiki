---
title: 经典案例与闭环板块设计
date: 2026-08-07
status: 已完成（LoopCycle 组件 + cases 板块 5 页 + 4 策略页闭环视角）
---

# 经典案例与闭环板块设计

> 背景:全站 103 页的展示模型全是「线性」的(`SignalFlow` 步骤箭头、`CaseWalk` 纵向时间线、`KLinePlayback` 单向回放),缺少**闭环**与**真实历史案例**两类内容。本文档设计新增 `LoopCycle` 组件 + `cases/` 板块,并给策略页补「闭环视角」。

## 一、核心洞察:闭环分两大类

| 类别 | 本质 | 视觉色 | 例子 |
|------|------|--------|------|
| **正反馈闭环(市场陷阱)** | 杠杆/自动规则把小波动放大成大波动,循环越转越快,直到边界打断 | `danger` 红/金 | 泡沫循环、强平螺旋、轧空闭环 |
| **策略/操作闭环(盈利机器)** | 一次循环的盈亏不重要,重要的是循环**期望值为正** | `neutral` 蓝 | 网格、均值回归、海龟、配对 |
| (行为层)把策略闭环变成亏损循环 | 情绪驱动,绕的是同一个环但方向反了 | `danger` 红 | 追涨杀跌、报复性交易 |

## 二、新增组件 `LoopCycle`(闭环循环图)

SVG 环形布局,节点绕椭圆排布,箭头逐环相连并回连成环。GSAP + ScrollTrigger 滚动触发:节点按循环顺序逐个点亮,最后一环回连箭头描边动画强调"闭环"。与 `SignalFlow` 交互语言一致,只是从「线」变「环」。

### Props 契约

```vue
<LoopCycle
  title="泡沫循环"
  kind="danger"                 <!-- danger | neutral | positive -->
  backLabel="自我强化"           <!-- 回连箭头上的标注 -->
  :nodes="[
    { label: '叙事点燃', detail: '新故事出现,早期买者赚钱' },
    { label: '赚钱效应', detail: '收益吸引场外资金' },
    { label: '杠杆涌入', detail: '融资/配资放大购买力' },
    { label: '价格加速', detail: '价格新高,越涨越信' },
    { label: '边界到来', detail: '接盘者/杠杆耗尽' },
    { label: '反转踩踏', detail: '去杠杆,循环反向' }
  ]"
/>
```

- `nodes`:循环节点数组,`{ label, detail? }`,3–6 个
- `kind`:`danger`(正反馈陷阱,红)/ `neutral`(策略循环,蓝)/ `positive`(正循环,绿)
- `title` / `backLabel`:可选
- 动画:节点随滚动逐一点亮(仿 `SignalFlow` 的 `activeStep`),回连箭头 `stroke-dashoffset` 描边

### 实现文件

- `docs/.vitepress/theme/components/LoopCycle.vue`(~180 行,SVG viewBox 460×240,椭圆参数 RX=200/RY=92,坐标由 node 数量均分计算)
- 注册:`theme/index.ts` 加 `app.component('LoopCycle', LoopCycle)`
- 契约:`components/README.md` 补一节(遵循"新增能力须记录"约定)
- 主题色随 `kind` 切换,暗色模式用 `var(--vp-c-*)` 适配

## 三、新增板块 `cases/`(经典案例与闭环)

导航:`nav` 加「经典案例」,位于「方法论」之后。侧边栏 `casesSidebar`。

```
docs/cases/
├── index.md               # 板块首页:两类闭环总览 + 分类导航
├── bubble-loop.md         # 泡沫循环(反身性)
├── margin-spiral.md       # 强平螺旋(流动性螺旋)
├── short-squeeze.md       # 轧空闭环
└── chase-kill-loop.md     # 追涨杀跌死循环(行为层)
```

### 案例页模板

1. **一句话**:闭环的本质一句话
2. **`<LoopCycle />`**:环形图,节点绕圈 + 回连
3. **经典实例时间线**:真实历史(公开记录,非编造行情),每个实例:年份 + 关键数字 + 循环在第几环
4. **机制拆解**:每一环怎么转、为什么转得起来
5. **为什么停不下来 / 打断机制**:边界条件(杠杆到顶/流动性枯竭/接盘者耗尽)
6. **对普通交易者的启示**:挂在方法论上
7. **相关页面**:交叉引用现有页面

> 内容规范:历史案例全部为**公开记录的事实**(年份、点位、金额),不涉及编造实时行情;若配图,只做标注"示意图(非真实行情)"的示意曲线,首期统一用 `LoopCycle` + 时间线,不加 K 线图。

### 首批 4 页内容要点

**1. bubble-loop 泡沫循环**
- 节点:叙事点燃 → 赚钱效应 → 场外资金+杠杆 → 价格加速 → 边界 → 反转踩踏
- 实例:1637 郁金香(一株珍稀球茎 ≈ 工匠十年收入)、1720 南海(£128→£1000→崩)、2000 互联网(纳指 5048→1114,−78%)、2015 A 股杠杆牛(上证 5178,两融 2.27 万亿)、2021 加密(比特币 6.9 万→1.5 万+)
- 教学点:反身性(Soros《金融炼金术》)、杠杆放大、周期顶部特征
- 挂靠:市场周期、货币政策、认知偏差

**2. margin-spiral 强平螺旋**
- 节点:价格下跌 → 保证金不足 → 追缴/强平 → 被迫卖出 → 价格更跌 → 更多触发
- 实例:1987 黑色星期一(道指单日 −22.6%,组合保险自动卖出)、LTCM 1998(俄违约后两周 −46%,美联储牵头 14 行注资 36 亿美元)、2015 A 股配资强平(千股跌停)、2010 闪崩(10 分钟 −9%)
- 教学点:杠杆双刃、止损纪律、流动性危机中"好资产也被贱卖"、相关性趋同
- 挂靠:组合风险、仓位管理、止损、市场微观结构、风险平价

**3. short-squeeze 轧空闭环**
- 节点:空头过重 → 价格上涨 → 空头浮亏 → 回补买入 → 价格更涨 → 更多回补
- 实例:VW/保时捷 2008(两天约 €210→€1005)、GameStop 2021(空头权益超流通盘,一月 17 倍)
- 教学点:做空风险不对称、动量极端、轧空是"基本面无关"的上涨
- 挂靠:动量策略、期货、交易心理

**4. chase-kill-loop 追涨杀跌死循环**
- 节点:大涨 → 眼红/怕踏空 → 追高 → 回调 → 恐慌割肉 → 反弹 → 懊悔 → 再追高
- 核心观点:把"均值回归/动量"的正期望循环,在情绪干扰下变成亏损循环
- 教学点:损失厌恶、羊群、锚定、纪律、交易日志
- 挂靠:认知偏差、纪律、回撤期心理

## 四、策略页补「闭环视角」(轻量,内容编辑)

给天然是闭环的策略页各加一小节 + `LoopCycle`,点破"这是循环,靠期望值而非单次":

- `strategies/quantitative/grid-trading.md`:网格买卖循环(跌买涨卖)
- `strategies/mean-reversion/bollinger-bounce.md` / `rsi-reversal.md`:均值回归循环(偏离→回归→再偏离)
- `strategies/trend-following/turtle-trading.md`:海龟系统循环(突破→加仓→追踪→离场→等下次),强调"60% 小亏 + 偶发大赚"的期望值结构

## 五、验证流程(遵循 CLAUDE.md 强制要求)

1. `npm run docs:build` — 构建通过
2. `node scripts/check-links.mjs` — 0 死链
3. headless 浏览器实测 `/cases/` 各页 + 含 `LoopCycle` 的策略页:
   - CDP 抓 console 无 JS 错误
   - `LoopCycle` 的 SVG 环形图真实渲染
   - 滚动后节点逐一点亮、回连箭头动画出现
   - 截图分析布局(对齐/溢出/留白)
4. `docs:preview` 端口检查 + 视口 1400×2000 截图 2–3 张

## 六、文件清单

**新增**:`docs/.vitepress/theme/components/LoopCycle.vue`、`docs/cases/{index,bubble-loop,margin-spiral,short-squeeze,chase-kill-loop}.md`

**修改**:`docs/.vitepress/theme/index.ts`(注册组件)、`docs/.vitepress/theme/components/README.md`(契约)、`docs/.vitepress/config.ts`(`casesSidebar` + nav)、4 个策略页(闭环视角小节)

## 七、不纳入范围

- 不给案例页配真实 K 线图(避免"编造行情"嫌疑;统一用 LoopCycle + 时间线)
- 不做回测/收益曲线类动画(历史案例以叙事为主)
- 不推荐具体股票/标的(与全站定位一致)
