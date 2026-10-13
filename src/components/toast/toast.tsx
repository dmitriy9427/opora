/**
 * Тосты — короткие всплывающие сообщения.
 *
 *   toast('Сохранено')
 *   toast.error('Не удалось сохранить', { description: 'Нет связи', action: { label: 'Повторить', onClick } })
 *
 * и один раз в приложении: <Toaster />
 *
 * ─── Почему функция, а не компонент ─────────────────────────────────────────
 * Сообщение показывают из обработчиков и запросов — мест, где компонента нет.
 * Поэтому список тостов живёт в хранилище вне React (обычный массив +
 * подписчики), а <Toaster /> читает его через useSyncExternalStore.
 *
 * ─── Доступность ────────────────────────────────────────────────────────────
 *   - каждый тост — «живая область»: role="status" (вежливо, когда скринридер
 *     договорит) или role="alert" для ошибок (сразу);
 *   - исчезают сами, но таймер ОСТАНАВЛИВАЕТСЯ, пока на тостах курсор или фокус,
 *     и пока вкладка скрыта: человек должен успеть прочитать (WCAG 2.2.1);
 *   - важное действие нельзя прятать только в тост: он исчезнет.
 */
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'

import { cx } from '../../primitives/compose'
import { Portal } from '../../primitives/portal'
import './toast.styles.css'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export type ToastOptions = {
  type?: ToastType
  description?: ReactNode
  /** Через сколько миллисекунд исчезнуть. Infinity — только вручную. */
  duration?: number
  action?: { label: string; onClick: () => void }
  /** Свой id: повторный вызов с тем же id обновит тост, а не создаст второй. */
  id?: string
}

type ToastItem = Required<Pick<ToastOptions, 'type' | 'duration'>> &
  Omit<ToastOptions, 'type' | 'duration' | 'id'> & { id: string; title: ReactNode; closing: boolean }

// ─── Хранилище ─────────────────────────────────────────────────────────────────

const EXIT_MS = 180
const LIMIT = 4
let items: ToastItem[] = []
let counter = 0
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const set = (next: ToastItem[]) => {
  items = next
  emit()
}

function show(title: ReactNode, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++counter}`
  const item: ToastItem = {
    ...options,
    id,
    title,
    type: options.type ?? 'info',
    duration: options.duration ?? (options.action ? 8000 : 5000),
    closing: false,
  }
  const exists = items.some((existing) => existing.id === id)
  // Новые — в конец; лишние старые закрываются, чтобы стопка не росла бесконечно.
  const next = exists ? items.map((existing) => (existing.id === id ? item : existing)) : [...items, item]
  set(next)
  next
    .filter((existing) => !existing.closing)
    .slice(0, -LIMIT)
    .forEach((old) => dismiss(old.id))
  return id
}

function dismiss(id?: string) {
  const targets = items.filter((item) => (id ? item.id === id : true) && !item.closing).map((item) => item.id)
  if (!targets.length) return
  // Сначала помечаем «закрывается» (играет анимация), потом удаляем.
  set(items.map((item) => (targets.includes(item.id) ? { ...item, closing: true } : item)))
  setTimeout(() => set(items.filter((item) => !targets.includes(item.id))), EXIT_MS)
}

type ToastFn = ((title: ReactNode, options?: ToastOptions) => string) & {
  success: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => string
  error: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => string
  warning: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => string
  /** Закрыть один тост или все (без аргумента). */
  dismiss: (id?: string) => void
}

export const toast: ToastFn = Object.assign(show, {
  success: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => show(title, { ...options, type: 'success' }),
  error: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => show(title, { ...options, type: 'error' }),
  warning: (title: ReactNode, options?: Omit<ToastOptions, 'type'>) => show(title, { ...options, type: 'warning' }),
  dismiss,
})

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const getSnapshot = () => items
const EMPTY: ToastItem[] = []

// ─── Компоненты ────────────────────────────────────────────────────────────────

export type ToasterProps = {
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
  /** Название области для скринридера. */
  label?: string
}

export function Toaster({ position = 'bottom-right', label = 'Уведомления' }: ToasterProps) {
  const list = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
  /** Таймеры на паузе: курсор или фокус на области либо вкладка скрыта. */
  const paused = useRef(false)

  return (
    <Portal>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- наведение и фокус ставят таймеры на паузу, это не «нажатие» */}
      <section
        // Область существует всегда, даже пустая: «живую область» скринридер должен знать ДО появления в ней текста.
        aria-label={label}
        className="op-toaster"
        data-position={position}
        // data-op-keep: открытый диалог не делает тосты недоступными (см. useInertOthers).
        data-op-keep=""
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
      >
        {list.map((item) => (
          <ToastView key={item.id} item={item} paused={paused} />
        ))}
      </section>
    </Portal>
  )
}

const ICONS: Record<ToastType, string> = {
  info: 'M8 7.5v4M8 5h.01',
  success: 'M4.5 8.5l2.5 2.5 4.5-5.5',
  warning: 'M8 5v4M8 11.5h.01',
  error: 'M5.5 5.5l5 5M10.5 5.5l-5 5',
}

function ToastView({ item, paused }: { item: ToastItem; paused: React.RefObject<boolean> }) {
  // Таймер «тикает» сам и не идёт на паузе: так оставшееся время сохраняется, а не начинается заново.
  useEffect(() => {
    if (!Number.isFinite(item.duration) || item.closing) return
    let left = item.duration
    let last = Date.now()
    const timer = setInterval(() => {
      const now = Date.now()
      if (!paused.current && !document.hidden) left -= now - last
      last = now
      if (left <= 0) dismiss(item.id)
    }, 100)
    return () => clearInterval(timer)
  }, [item.id, item.duration, item.closing, paused])

  return (
    <div
      // Ошибка — alert (скринридер прервётся и зачитает сразу), остальное — status (дождётся паузы).
      role={item.type === 'error' ? 'alert' : 'status'}
      className={cx('op-toast')}
      data-type={item.type}
      data-state={item.closing ? 'closed' : 'open'}
    >
      <svg
        className="op-toast__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d={ICONS[item.type]} />
      </svg>
      <div className="op-toast__text">
        <div className="op-toast__title">{item.title}</div>
        {item.description && <div className="op-toast__description">{item.description}</div>}
      </div>
      {item.action && (
        <button
          type="button"
          className="op-toast__action"
          onClick={() => {
            item.action!.onClick()
            dismiss(item.id)
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className="op-toast__close" aria-label="Закрыть уведомление" onClick={() => dismiss(item.id)}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}

/** Для тестов: очистить хранилище. */
export function resetToasts() {
  items = []
  counter = 0
  emit()
}
