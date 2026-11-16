/**
 * Акцентная тема хранится у пользователя, а не в браузере: иначе на другом
 * устройстве аккаунт открывается с чужим (дефолтным) цветом.
 *
 * Список совпадает с `ACCENTS` во фронтенде (`src/utils/theme.ts`).
 */
export const ACCENT_IDS = ['purple', 'blue', 'cyan', 'green', 'orange', 'pink', 'red'] as const

export type AccentId = (typeof ACCENT_IDS)[number]

/** `null` означает «пользователь ещё не выбирал» — фронт подставит локальное значение. */
export function normalizeAccentId(value: unknown): AccentId | null {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
  return (ACCENT_IDS as readonly string[]).includes(raw) ? (raw as AccentId) : null
}
