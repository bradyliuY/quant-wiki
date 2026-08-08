# Quant Wiki

个人量化交易学习站点，内容使用 Markdown，交互演示使用 Vue 组件。

## 全局约束

- 演示数据必须是教学用合成数据，不得编造真实股票价格或行情。
- 不提供具体股票推荐或实时行情。
- `docs/.vitepress/theme/components/README.md` 是组件接口契约；新增能力需先更新契约，不要为单个内容页随意修改组件或数据层。

## 验证

修改内容或组件后必须依次执行：

1. `npm run docs:build`
2. `node scripts/check-links.mjs`，结果应为死链 0、导航未接入 0
3. 在浏览器中实测改动页面

## 提交规范

- 使用 Conventional Commits：`feat:`、`fix:`、`docs:`、`chore:`。
- 提交信息需含 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
