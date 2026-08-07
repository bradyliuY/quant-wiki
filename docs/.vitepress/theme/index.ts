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
import OptionPnl from './components/OptionPnl.vue'
import OrderExec from './components/OrderExec.vue'
import LeverageSim from './components/LeverageSim.vue'
import PESim from './components/PESim.vue'

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
    app.component('OptionPnl', OptionPnl)
    app.component('OrderExec', OrderExec)
    app.component('LeverageSim', LeverageSim)
    app.component('PESim', PESim)
  }
} satisfies Theme
