/**
 * Presence: дать элементу доиграть анимацию закрытия, прежде чем убрать его из DOM.
 *
 * React удаляет элемент мгновенно: {open && <div/>} — и анимации «исчезновения»
 * не видно. Здесь элемент остаётся ещё на время анимации:
 *
 *   open = true            → present = true,  data-state="open"   (играет анимация входа)
 *   open = false           → present = true,  data-state="closed" (играет анимация выхода)
 *   анимация закончилась   → present = false  (элемент удалён)
 *
 * Сама анимация — в CSS, по атрибуту data-state. Если её нет (или включено
 * «уменьшить движение»), элемент удаляется сразу.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function usePresence(open: boolean) {
  const [present, setPresent] = useState(open)
  const node = useRef<HTMLElement | null>(null)

  // Открыли — показываем сразу, не дожидаясь эффекта (иначе кадр без содержимого).
  if (open && !present) setPresent(true)

  useEffect(() => {
    const element = node.current
    if (open || !present) return
    if (!element) return setPresent(false)

    const style = getComputedStyle(element)
    const animated = style.animationName && style.animationName !== 'none' && parseFloat(style.animationDuration) > 0
    if (!animated) return setPresent(false)

    const done = (event: AnimationEvent) => {
      // Анимации детей всплывают сюда же — ждём именно свою.
      if (event.target === element) setPresent(false)
    }
    element.addEventListener('animationend', done)
    element.addEventListener('animationcancel', done)
    return () => {
      element.removeEventListener('animationend', done)
      element.removeEventListener('animationcancel', done)
    }
  }, [open, present])

  const ref = useCallback((element: HTMLElement | null) => {
    node.current = element
  }, [])

  return { present, ref, state: open ? ('open' as const) : ('closed' as const) }
}
