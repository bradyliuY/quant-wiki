# 量化知识库 · 项目状态与收尾记录

> 日期：2026-08-07
> 状态：**全站已完成并上线** —— 6 个阶段全部实施完毕，GitHub Pages 已部署

## 一、总进度

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | VitePress 壳 + 主题 + 首页 + 7 组件骨架 | ✅ 完成 |
| Phase 2 | 指标大全（5 类 22 页）+ C2/C3 | ✅ 完成 |
| Phase 3 | 方法论（评分/形态/风控/回测/心理 21 页）+ C4/C6/C7 | ✅ 完成 |
| Phase 4 | 策略库（5 族 24 页）+ C1/C5 | ✅ 完成 |
| Phase 5 | 新手指南 6 页 + 金融基础 22 页 | ✅ 完成 |
| Phase 6 | 交叉引用 + 死链扫描 + 本地搜索 + GitHub Pages 部署 | ✅ 完成 |

**总计 103 个 HTML 页面，全部 6 个阶段已完结。**

## 二、Phase 6 收尾明细（本次会话完成）

1. **死链扫描**：新增 `scripts/check-links.mjs` 全站链接扫描器（102 个 md，0 死链）
   - 注意：扫描器对 Windows 路径需用 `path.posix`，绝对链接直接 `normalize` 而非 `join`
2. **构建验证**：`npm run docs:build` 通过，无报错
3. **组件 SSR 验证**：7 组件骨架均在构建产物中渲染
   - `chart-container` 52 页 / `signal-flow` 32 页 / `calc-explorer` 7 页 / `compare-grid` 3 页 / `radar-svg` + `score-matrix` 1 页
4. **搜索**：`search.provider: 'local'` 已启用（Phase 1 配置，未改动）
5. **GitHub Pages 部署**：
   - `config.ts` 增加 `base: process.env.BASE_URL || '/'`（本地根路径，线上 `/quant-wiki/`）
   - 新增 `.github/workflows/deploy.yml`（push master 自动构建部署）
   - **踩坑记录**：GitHub Pages 免费套餐**不支持私有仓库**；`gh repo edit --visibility public --accept-visibility-change-consequences` 改公开后，需先 `POST /repos/{owner}/{repo}/pages` 启用 Pages（`build_type=workflow`），再 push 触发部署
   - 部署地址：https://bradyliuy.github.io/quant-wiki/ （已 curl 验证 200）

## 三、后续可做（可选，不影响上线）

- 增加 GA / 访问统计（VitePress 支持 head 注入）
- 移动端动画效果微调（GSAP 触屏滚动）
- 更多策略/指标内容扩充
- 内容搜索体验优化（可换 algolia 等外部搜索）

## 四、关键路径速查

```
docs/.vitepress/config.ts              # 站点配置 + 侧边栏（6 个 section）
docs/.vitepress/theme/index.ts         # 组件全局注册
docs/.vitepress/theme/components/      # 7 个可复用动画组件
docs/.vitepress/theme/lib/             # charts.ts + indicators.ts 数据层
scripts/check-links.mjs                # 死链扫描器（node scripts/check-links.mjs）
.github/workflows/deploy.yml           # Pages 自动部署
```
