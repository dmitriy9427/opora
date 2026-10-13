/**
 * Мелкие помощники, на которых стоят все компоненты.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Ref, type RefCallback } from 'react'

/** Склеить классы, пропуская пустые: cx('a', false, undefined, 'b') → 'a b'. */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ') || undefined

/**
 * Один элемент — несколько ref.
 * Компоненту нужен свой ref (измерить, сфокусировать), и пользователь тоже
 * передаёт ref. composeRefs раздаёт узел всем.
 */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    // В React 19 ref-функция может вернуть «очистку» — собираем их, чтобы вызвать при размонтировании.
    const cleanups: (() => void)[] = []
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        if (typeof cleanup === 'function') cleanups.push(cleanup)
        else cleanups.push(() => ref(null))
      } else if (ref) {
        ref.current = node
        cleanups.push(() => {
          ref.current = null
        })
      }
    }
    return () => cleanups.forEach((cleanup) => cleanup())
  }
}

/**
 * Склеить два обработчика события: сначала пользовательский, потом наш.
 * Пользователь может отменить наше поведение через event.preventDefault().
 */
export function composeHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event)
    if (!event.defaultPrevented) ours(event)
  }
}

/**
 * Управляемое или неуправляемое состояние — одним хуком.
 *
 *   <Tabs defaultValue="a" />                  неуправляемое: компонент хранит значение сам
 *   <Tabs value={tab} onValueChange={setTab}/> управляемое: значением владеет родитель
 *
 * Так же устроен обычный <input>: либо defaultValue, либо value + onChange.
 * Режим определяется один раз — по тому, передан ли value.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner

  // Самая свежая функция onChange — в ref, чтобы setValue не менялся на каждый рендер.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const setValue = useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
      onChangeRef.current?.(next)
    },
    [controlled],
  )
  return [current, setValue] as const
}

/**
 * useLayoutEffect, который не ругается при серверном рендеринге.
 * На сервере раскладки нет, и React предупреждает о бесполезном эффекте.
 */
export const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect

/** Самая свежая версия значения — для обработчиков, подписанных один раз. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useIsomorphicLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
