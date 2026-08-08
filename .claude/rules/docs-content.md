---
paths:
  - "docs/**/*.md"
  - "docs/.vitepress/config.ts"
---

# 内容层规则

## 页面与导航

- 目录、导航与 URL 必须一致；新增页面必须同步加入 `docs/.vitepress/config.ts` 对应 sidebar。
- 目录最深三层：板块/分类/页面。
- 每个分类目录必须有 `index.md`，并作为 sidebar 分组标题的 `link`。
- `plans/` 页面随站发布，但不加入 sidebar；文件名使用 `YYYY-MM-DD-<topic>-design.md` 或 `-plan.md`。
- 指标页结构：一句话总结 → 公式 → 参数表 → `IndicatorDemo` → 信号解读 → 实战用法 → 常见误区 → 相关。
- 策略页结构：概述 → `SignalFlow` → `KLinePlayback` → 入场/出场/止损规则 → 回测参考表 → 相关。
- 回测表必须明确标注“示意数据”。

## 可视化验证

不能仅通过代码判断 UI 或动画，必须真实运行并截图检查。

1. 构建后启动 `npm run docs:preview -- --port 4173`；端口被旧进程占用时换 4174。
2. 等页面渲染和动画稳定后，截取全页及 2–3 个滚动位置。
3. 检查对齐、间距、溢出、截断、空白、乱码和控制台异常。
4. 确认 `.chart-container` 内存在 canvas，图表不是 SSR 空骨架。
5. 操作按钮、标签页或滑块，确认状态真实变化。
6. 当前会话无法直接理解截图时，调用 `vision` 技能分析。

SSR 只输出组件容器骨架是正常行为，不能据此判断客户端图表未渲染。
