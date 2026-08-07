# 📈 量化交易知识库

> 带动画的量化投资学习平台 —— 从零基础入门到系统化的策略、指标与方法论，全部配以动态可视化演示。

基于 **VitePress** 构建的个人量化知识库，使用 **lightweight-charts**（行情图表演示）与 **GSAP**（滚动驱动概念动画）。

## ✨ 特色

- **动态图表演示**：所有指标页配数据回放，拖动时间轴观察指标演化
- **策略行情回放**：每个策略配 K 线生长动画与买卖点标注
- **交互式计算器**：凯利公式、仓位管理、风险回报比，拖动滑块实时计算
- **滚动驱动动画**：GSAP 驱动的逐步讲解

## 🗂️ 内容板块

| 板块 | 说明 |
|------|------|
| 🚀 新手指南 | 零基础渐进式学习路径 |
| 🏛️ 金融基础 | 资产类别、基本面、宏观经济、市场机制 |
| 📊 指标大全 | 趋势 / 动量 / 波动率 / 成交量 / 叠加五大类 |
| 🎯 策略库 | 趋势跟踪 / 均值回归 / 动量 / 形态 / 量化五大族 |
| 📐 方法论 | 评分模型、风险管理、回测、交易心理 |
| 📚 参考 | 术语词典、书单、学习路线 |

## 🚀 本地开发

```bash
npm install
npm run docs:dev      # 启动开发服务器 http://localhost:5173
npm run docs:build    # 构建静态站点
npm run docs:preview  # 预览构建产物
```

## 🌐 部署

### GitHub Pages（自动）

1. 在 GitHub 上创建仓库 `quant-wiki`（默认私有即可）
2. 推送代码：`git push origin master`
3. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**
4. 之后每次 push 到 master 自动构建部署到 `https://<用户名>.github.io/quant-wiki/`

> 部署在子路径 `/quant-wiki/`，由 `config.ts` 的 `base` 配置控制
> （通过 `BASE_URL` 环境变量注入，本地开发仍用根路径）。

### 其他平台

构建产物在 `docs/.vitepress/dist/`，是纯静态文件，可部署到任意静态托管
（Vercel / Netlify / 对象存储等）。

## 🛠️ 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成
- [lightweight-charts](https://github.com/tradingview/lightweight-charts) — 行情图表
- [GSAP](https://gsap.com/) + ScrollTrigger — 滚动动画

## ⚖️ 免责声明

本站内容仅供学习研究，不构成任何投资建议。
