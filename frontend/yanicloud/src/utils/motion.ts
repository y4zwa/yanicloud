/**
 * Небольшие глобальные помощники для анимаций.
 * pulseThemeChange() — плавная смена акцентной темы без редизайна.
 */

let themeTimer: number | undefined

export function pulseThemeChange(): void {
  const root = document.documentElement
  root.classList.remove('theme-morphing')
  // force reflow, чтобы анимация запустилась заново при повторном клике
  void root.offsetWidth
  root.classList.add('theme-morphing')
  window.clearTimeout(themeTimer)
  themeTimer = window.setTimeout(() => root.classList.remove('theme-morphing'), 620)
}
