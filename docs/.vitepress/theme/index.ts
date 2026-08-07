import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

// 动画与图表组件
import KLinePlayback from './components/KLinePlayback.vue'
import IndicatorDemo from './components/IndicatorDemo.vue'
import ComparePanel from './components/ComparePanel.vue'
import CalcExplorer from './components/CalcExplorer.vue'
import SignalFlow from './components/SignalFlow.vue'
import PatternGrowth from './components/PatternGrowth.vue'
import ScoreMatrix from './components/ScoreMatrix.vue'
import CalcDemo from './components/CalcDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('KLinePlayback', KLinePlayback)
    app.component('IndicatorDemo', IndicatorDemo)
    app.component('ComparePanel', ComparePanel)
    app.component('CalcExplorer', CalcExplorer)
    app.component('SignalFlow', SignalFlow)
    app.component('PatternGrowth', PatternGrowth)
    app.component('ScoreMatrix', ScoreMatrix)
    app.component('CalcDemo', CalcDemo)
  }
} satisfies Theme
