import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '量化交易知识库',
  description: '带动画的量化投资学习平台',
  lang: 'zh-CN',
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '新手指南', link: '/getting-started/' },
      { text: '金融基础', link: '/fundamentals/' },
      { text: '指标大全', link: '/indicators/' },
      { text: '策略库', link: '/strategies/' },
      { text: '方法论', link: '/methodology/' }
    ],
    sidebar: {},
    search: {
      provider: 'local'
    },
    footer: {
      message: '本站内容仅供学习参考，不构成投资建议',
      copyright: '量化交易知识库'
    }
  }
})
