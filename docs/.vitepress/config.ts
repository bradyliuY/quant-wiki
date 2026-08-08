import { defineConfig, type DefaultTheme } from 'vitepress'

const indicatorsSidebar: DefaultTheme.SidebarItem[] = [
  { text: '指标大全', link: '/indicators/' },
  { text: '指标总览与选择', link: '/indicators/overview' },
  {
    text: '趋势指标',
    collapsed: false,
    items: [
      { text: '移动平均线 MA', link: '/indicators/trend/ma' },
      { text: 'MACD', link: '/indicators/trend/macd' },
      { text: 'ADX', link: '/indicators/trend/adx' },
      { text: '抛物线 SAR', link: '/indicators/trend/parabolic-sar' }
    ]
  },
  {
    text: '动量指标',
    collapsed: false,
    items: [
      { text: 'RSI', link: '/indicators/momentum/rsi' },
      { text: '随机指标 KD', link: '/indicators/momentum/stochastic' },
      { text: 'CCI', link: '/indicators/momentum/cci' },
      { text: '威廉指标', link: '/indicators/momentum/williams-r' }
    ]
  },
  {
    text: '波动率指标',
    collapsed: false,
    items: [
      { text: '布林带', link: '/indicators/volatility/bollinger-bands' },
      { text: 'ATR', link: '/indicators/volatility/atr' },
      { text: '肯特纳通道', link: '/indicators/volatility/keltner-channels' },
      { text: '唐奇安通道', link: '/indicators/volatility/donchian' }
    ]
  },
  {
    text: '成交量指标',
    collapsed: false,
    items: [
      { text: 'OBV', link: '/indicators/volume/obv' },
      { text: '成交量分布', link: '/indicators/volume/volume-profile' },
      { text: 'MFI', link: '/indicators/volume/mfi' }
    ]
  },
  {
    text: '叠加指标',
    collapsed: false,
    items: [
      { text: '一目均衡表', link: '/indicators/overlay/ichimoku' },
      { text: '枢轴点', link: '/indicators/overlay/pivot-points' }
    ]
  }
]

const methodologySidebar: DefaultTheme.SidebarItem[] = [
  { text: '方法论', link: '/methodology/' },
  { text: '100 分评分模型', link: '/methodology/scoring-model' },
  {
    text: '形态识别库',
    collapsed: false,
    items: [
      { text: '反转形态', link: '/methodology/pattern-library/reversal-patterns' },
      { text: '中继形态', link: '/methodology/pattern-library/continuation-patterns' },
      { text: 'K 线形态', link: '/methodology/pattern-library/candlestick-patterns' }
    ]
  },
  {
    text: '风险管理',
    collapsed: false,
    items: [
      { text: '凯利公式', link: '/methodology/risk-management/kelly-criterion' },
      { text: '仓位管理', link: '/methodology/risk-management/position-sizing' },
      { text: '止损策略', link: '/methodology/risk-management/stop-loss' },
      { text: '止盈策略', link: '/methodology/risk-management/take-profit' },
      { text: '组合风险管理', link: '/methodology/risk-management/portfolio-risk' }
    ]
  },
  {
    text: '回测方法论',
    collapsed: false,
    items: [
      { text: '回测的正确姿势', link: '/methodology/backtesting/how-to-backtest' },
      { text: '常见陷阱', link: '/methodology/backtesting/common-pitfalls' },
      { text: '绩效指标', link: '/methodology/backtesting/performance-metrics' },
      { text: '样本外检验', link: '/methodology/backtesting/walk-forward' }
    ]
  },
  {
    text: '统计与概率基础',
    collapsed: false,
    items: [
      { text: '统计基础总览', link: '/methodology/statistics/' },
      { text: '期望值', link: '/methodology/statistics/expected-value' },
      { text: '波动与最大回撤', link: '/methodology/statistics/variance-drawdown' },
      { text: '相关性', link: '/methodology/statistics/correlation' }
    ]
  },
  {
    text: '交易心理',
    collapsed: false,
    items: [
      { text: '认知偏差', link: '/methodology/trading-psychology/cognitive-biases' },
      { text: '纪律执行', link: '/methodology/trading-psychology/discipline' },
      { text: '回撤期心理', link: '/methodology/trading-psychology/drawdown-psychology' }
    ]
  }
]

const strategiesSidebar: DefaultTheme.SidebarItem[] = [
  { text: '策略库', link: '/strategies/' },
  { text: '策略总览', link: '/strategies/overview' },
  { text: '策略代码实现', link: '/strategies/code-examples' },
  {
    text: '趋势跟踪',
    collapsed: false,
    items: [
      { text: '双均线交叉', link: '/strategies/trend-following/ma-crossover' },
      { text: 'MACD 交易系统', link: '/strategies/trend-following/macd-strategy' },
      { text: '海龟交易法则', link: '/strategies/trend-following/turtle-trading' },
      { text: '通道突破', link: '/strategies/trend-following/channel-breakout' }
    ]
  },
  {
    text: '均值回归',
    collapsed: false,
    items: [
      { text: '布林带回归', link: '/strategies/mean-reversion/bollinger-bounce' },
      { text: 'RSI 反转', link: '/strategies/mean-reversion/rsi-reversal' },
      { text: 'KD 超买超卖', link: '/strategies/mean-reversion/stochastic-strategy' },
      { text: '配对交易', link: '/strategies/mean-reversion/pairs-trading' }
    ]
  },
  {
    text: '动量策略',
    collapsed: false,
    items: [
      { text: '双动量轮动', link: '/strategies/momentum/dual-momentum' },
      { text: 'RSI 动量', link: '/strategies/momentum/rsi-momentum' },
      { text: '相对强弱排名', link: '/strategies/momentum/strength-ranking' }
    ]
  },
  {
    text: '形态交易',
    collapsed: false,
    items: [
      { text: '双底突破', link: '/strategies/pattern-trading/double-bottom-trade' },
      { text: '三角形突破', link: '/strategies/pattern-trading/triangle-breakout' },
      { text: '头肩形态', link: '/strategies/pattern-trading/head-shoulders-trade' },
      { text: '旗形交易', link: '/strategies/pattern-trading/flag-consolidation' }
    ]
  },
  {
    text: '量化进阶',
    collapsed: false,
    items: [
      { text: '多因子模型', link: '/strategies/quantitative/factor-model' },
      { text: '网格交易', link: '/strategies/quantitative/grid-trading' },
      { text: '风险平价', link: '/strategies/quantitative/risk-parity' }
    ]
  },
  {
    text: '价值低估',
    collapsed: false,
    items: [
      { text: '低估值筛选', link: '/strategies/value/low-valuation' },
      { text: '高股息收息', link: '/strategies/value/dividend-yield' }
    ]
  },
  {
    text: '事件驱动',
    collapsed: false,
    items: [
      { text: '财报后动量', link: '/strategies/event-driven/earnings-drift' },
      { text: '指数调仓博弈', link: '/strategies/event-driven/index-rebalance' }
    ]
  }
]

const fundamentalsSidebar: DefaultTheme.SidebarItem[] = [
  { text: '金融基础', link: '/fundamentals/' },
  {
    text: '资产类别',
    collapsed: false,
    items: [
      { text: '资产类别总览', link: '/fundamentals/asset-classes/overview' },
      { text: '股票', link: '/fundamentals/asset-classes/stocks' },
      { text: 'ETF', link: '/fundamentals/asset-classes/etf' },
      { text: '期货', link: '/fundamentals/asset-classes/futures' },
      { text: '期权', link: '/fundamentals/asset-classes/options' },
      { text: '外汇', link: '/fundamentals/asset-classes/forex' },
      { text: '加密货币', link: '/fundamentals/asset-classes/crypto' }
    ]
  },
  {
    text: '基本面分析',
    collapsed: false,
    items: [
      { text: '三张财务报表', link: '/fundamentals/fundamental-analysis/financial-statements' },
      { text: '估值方法', link: '/fundamentals/fundamental-analysis/valuation' },
      { text: '盈利能力', link: '/fundamentals/fundamental-analysis/profitability' },
      { text: '成长与质量', link: '/fundamentals/fundamental-analysis/growth-quality' }
    ]
  },
  {
    text: '宏观经济',
    collapsed: false,
    items: [
      { text: '货币政策', link: '/fundamentals/macroeconomics/monetary-policy' },
      { text: '经济指标', link: '/fundamentals/macroeconomics/economic-indicators' },
      { text: '市场周期', link: '/fundamentals/macroeconomics/market-cycles' },
      { text: '地缘政治', link: '/fundamentals/macroeconomics/geopolitical' }
    ]
  },
  {
    text: '市场机制',
    collapsed: false,
    items: [
      { text: '委托类型', link: '/fundamentals/market-mechanics/order-types' },
      { text: '交易时间与结算', link: '/fundamentals/market-mechanics/trading-hours' },
      { text: '市场微观结构', link: '/fundamentals/market-mechanics/market-microstructure' }
    ]
  }
]

const gettingStartedSidebar: DefaultTheme.SidebarItem[] = [
  { text: '新手指南', link: '/getting-started/' },
  { text: '什么是量化投资', link: '/getting-started/what-is-quant' },
  { text: '市场基础', link: '/getting-started/market-basics' },
  { text: 'K 线入门', link: '/getting-started/candlestick-101' },
  { text: '时间框架', link: '/getting-started/timeframes' },
  { text: '第一个策略', link: '/getting-started/first-strategy' }
]

const casesSidebar: DefaultTheme.SidebarItem[] = [
  { text: '经典案例与闭环', link: '/cases/' },
  { text: '泡沫循环', link: '/cases/bubble-loop' },
  { text: '强平螺旋', link: '/cases/margin-spiral' },
  { text: '轧空闭环', link: '/cases/short-squeeze' },
  { text: '追涨杀跌死循环', link: '/cases/chase-kill-loop' }
]

const referenceSidebar: DefaultTheme.SidebarItem[] = [
  { text: '参考', link: '/reference/' },
  { text: '量化术语词典', link: '/reference/glossary' },
  { text: '推荐书单与学习路线', link: '/reference/reading-list' },
  { text: '关于本站', link: '/reference/about' }
]

const practiceSidebar: DefaultTheme.SidebarItem[] = [
  { text: '实战', link: '/practice/' },
  { text: '回测实验室', link: '/practice/backtest-lab' },
  { text: 'Python 环境与数据获取', link: '/practice/python-setup' },
  { text: '用回测框架跑通第一个策略', link: '/practice/first-backtest' },
  { text: '模拟盘实操', link: '/practice/paper-trading' }
]

// GitHub Pages 部署到子路径 /quant-wiki/；本地开发自动用根路径
const base = process.env.BASE_URL || '/'

export default defineConfig({
  title: '量化交易知识库',
  description: '带动画的量化投资学习平台',
  lang: 'zh-CN',
  base,
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  head: [
    // 品牌 favicon
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    // 浏览器主题色（与深蓝品牌一致）
    ['meta', { name: 'theme-color', content: '#0f3d8c' }],
    // SEO
    ['meta', { name: 'keywords', content: '量化交易,量化投资,技术指标,交易策略,回测,均线,MACD,RSI,K线,量化学习' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    // Open Graph 社交分享
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '量化交易知识库' }],
    ['meta', { property: 'og:description', content: '带动画的量化投资学习平台：从零基础入门到系统化的策略、指标与方法论' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:image', content: `${base}og-image.png` }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: '量化交易知识库' }],
    ['meta', { name: 'twitter:description', content: '带动画的量化投资学习平台' }]
  ],
  themeConfig: {
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '新手指南', link: '/getting-started/' },
      { text: '金融基础', link: '/fundamentals/' },
      { text: '指标大全', link: '/indicators/' },
      { text: '策略库', link: '/strategies/' },
      { text: '方法论', link: '/methodology/' },
      { text: '实战', link: '/practice/' },
      { text: '经典案例', link: '/cases/' }
    ],
    sidebar: {
      '/getting-started/': gettingStartedSidebar,
      '/fundamentals/': fundamentalsSidebar,
      '/indicators/': indicatorsSidebar,
      '/strategies/': strategiesSidebar,
      '/methodology/': methodologySidebar,
      '/cases/': casesSidebar,
      '/practice/': practiceSidebar,
      '/reference/': referenceSidebar
    },
    search: {
      provider: 'local'
    },
    footer: {
      message: '本站内容仅供学习参考，不构成投资建议',
      copyright: '量化交易知识库'
    }
  }
})
