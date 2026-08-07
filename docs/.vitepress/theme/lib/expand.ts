/**
 * 图表放大（全屏）工具
 * 通过给 .chart-container 加 .expanded 类，用 position:fixed 提升为全屏覆盖层。
 * lightweight-charts 的 autoSize 会自动适配新尺寸，无需重建图表。
 */

/** 当前展开中的元素 */
let expandedEl: HTMLElement | null = null
/** 遮罩元素 */
let maskEl: HTMLDivElement | null = null
/** 状态变化回调（组件用它更新 expanded ref 切换按钮图标） */
let stateCb: ((expanded: boolean) => void) | null = null

/** 监听 Esc 关闭 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') collapseExpand()
}

/** 关闭放大 */
export function collapseExpand() {
  if (!expandedEl) return
  expandedEl.classList.remove('expanded')
  maskEl?.remove()
  maskEl = null
  document.removeEventListener('keydown', onKeydown)
  expandedEl = null
  stateCb?.(false)
}

/** 展开 / 切换 */
export function toggleExpand(el: HTMLElement | null, cb?: (expanded: boolean) => void) {
  if (!el) return
  if (cb) stateCb = cb
  // 若已展开同一元素 → 收起
  if (expandedEl === el) {
    collapseExpand()
    return
  }
  // 展开新元素：先收起旧的
  if (expandedEl) collapseExpand()

  expandedEl = el
  el.classList.add('expanded')
  stateCb?.(true)

  // 遮罩（点击关闭）
  maskEl = document.createElement('div')
  maskEl.className = 'expand-mask'
  maskEl.addEventListener('click', collapseExpand)
  document.body.appendChild(maskEl)

  document.addEventListener('keydown', onKeydown)
}
