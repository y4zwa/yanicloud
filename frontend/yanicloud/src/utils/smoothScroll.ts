/**
 * Плавная инерционная прокрутка колесом для основной области.
 *
 * Работает только с вертикальным колесом внутри переданного контейнера.
 * Нативные жесты не ломаем:
 *  - Ctrl+колесо (зум) — не трогаем;
 *  - Shift+колесо и горизонтальные жесты — отдаём браузеру;
 *  - элементы с [data-native-scroll] — прокручиваются сами;
 *  - клавиатура, скроллбар и тач — нативные.
 */

export interface SmoothScrollHandle {
  destroy(): void
}

interface Options {
  /** Время «догона» в мс: меньше — резче, больше — плавнее. */
  timeConstant?: number
  /** Сила прокрутки: 1 — как есть, 0.93 — чуть мягче. */
  strength?: number
}

export function attachSmoothScroll(el: HTMLElement, options: Options = {}): SmoothScrollHandle {
  const timeConstant = options.timeConstant ?? 42
  const strength = options.strength ?? 0.93
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  let target = el.scrollTop
  let current = el.scrollTop
  let raf = 0
  let lastTime = 0
  let fallback = 0

  const maxScroll = (): number => Math.max(0, el.scrollHeight - el.clientHeight)
  const clamp = (value: number): number => Math.min(maxScroll(), Math.max(0, value))

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf)
    if (fallback) window.clearTimeout(fallback)
    raf = 0
    fallback = 0
    lastTime = 0
  }

  const sync = (): void => {
    stop()
    target = el.scrollTop
    current = el.scrollTop
  }

  const tick = (now: number): void => {
    if (fallback) {
      window.clearTimeout(fallback)
      fallback = 0
    }
    if (reduceMotion.matches) {
      el.scrollTop = target
      raf = 0
      return
    }
    if (!lastTime) lastTime = now
    const dt = Math.min(64, Math.max(1, now - lastTime))
    lastTime = now

    const diff = target - current
    if (Math.abs(diff) < 0.35) {
      current = target
      el.scrollTop = current
      raf = 0
      lastTime = 0
      return
    }

    current += diff * (1 - Math.exp(-dt / timeConstant))
    el.scrollTop = current
    raf = requestAnimationFrame(tick)
  }

  const start = (): void => {
    if (raf) return
    lastTime = 0
    raf = requestAnimationFrame(tick)
    // Страховка: если rAF в фоне затормозился, не ждём «через секунду»,
    // а сразу доводим до цели.
    fallback = window.setTimeout(() => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
      current = target
      el.scrollTop = current
      lastTime = 0
    }, 70)
  }

  const onWheel = (event: WheelEvent): void => {
    // Зум браузера, горизонтальные жесты и shift-скролл не перехватываем.
    if (event.ctrlKey || event.shiftKey) return
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

    const targetEl = event.target as Element | null
    if (targetEl?.closest?.('[data-native-scroll]')) return

    let delta = event.deltaY
    if (event.deltaMode === 1) delta *= 16
    else if (event.deltaMode === 2) delta *= el.clientHeight
    if (!delta) return

    event.preventDefault()
    current = clamp(el.scrollTop)
    target = clamp(target + delta * strength)
    start()
  }

  // Пользователь потянул скроллбар / нажал клавиши / браузер сам прокрутил —
  // отдаём управление нативному скроллу, чтобы не было борьбы.
  const onScroll = (): void => {
    if (Math.abs(el.scrollTop - current) > 3) sync()
  }

  const onPointerDown = (): void => sync()
  const onKeyDown = (): void => sync()
  const onResize = (): void => {
    target = clamp(target)
    current = clamp(current)
  }
  const onMotionChange = (): void => {
    if (reduceMotion.matches) sync()
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('scroll', onScroll, { passive: true })
  el.addEventListener('pointerdown', onPointerDown, { passive: true })
  el.addEventListener('keydown', onKeyDown, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  reduceMotion.addEventListener?.('change', onMotionChange)

  return {
    destroy(): void {
      stop()
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      reduceMotion.removeEventListener?.('change', onMotionChange)
    },
  }
}
