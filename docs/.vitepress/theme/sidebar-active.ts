/**
 * 侧边栏"当前页高亮"增强。
 *
 * 背景：本项目（VitePress 1.6.4 + cleanUrls + 手写 sidebar）下，
 * 框架自身的 is-active 类未稳定落地（onMounted 里按 relativePath 计算，
 * 实测从不生效，live 站点同样如此），仅父级 has-active 生效。
 * 这里在客户端按当前 URL 精确匹配，为对应侧边栏项补上 is-active，
 * custom.css 已按该 class 提供高亮样式。
 *
 * 幂等且不干扰框架：若框架逻辑在某环境正常置 true，这里匹配一致、保持 true；
 * 匹配不一致时才移除，行为与框架意图一致。enhanceApp 在 SSR 也会执行，
 * 用 typeof window 守卫保证仅客户端生效。
 */
const setupSidebarActive = (): void => {
  if (typeof window === 'undefined') return

  const apply = () => {
    // 归一化：去尾部斜杠；首页为 '/'
    const path = location.pathname.replace(/\/+$/, '') || '/'
    document.querySelectorAll<HTMLElement>('.VPSidebarItem.is-link').forEach((item) => {
      const a = item.querySelector<HTMLAnchorElement>('a')
      if (!a) return
      const href = (a.getAttribute('href') || '').split('#')[0].replace(/\/+$/, '') || '/'
      item.classList.toggle('is-active', href === path)
    })
  }

  // 侧边栏在加载与 SPA 导航后都会重渲染，用 MutationObserver 兜底（rAF 防抖）
  let raf = 0
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(apply)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  apply()
}

export default setupSidebarActive
