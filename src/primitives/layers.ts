/**
 * Слои: всё, что открывается поверх страницы, — диалог, поповер, меню, селект.
 *
 * У всех них общие вопросы:
 *   - Escape закрывает… что именно? Если из диалога открыто меню — только меню.
 *   - Клик «мимо» закрывает… что? Клик по диалогу закрывает меню над ним, но не сам диалог.
 *
 * Ответ — стопка слоёв. Открылся — лёг сверху. Escape достаётся верхнему.
 * Клик закрывает все слои, лежащие ВЫШЕ того, по которому кликнули.
 *
 * Обработчики на document — одни на всю библиотеку, а не по штуке на каждый
 * открытый компонент: они и решают, кому что достанется.
 */
import { useEffect, useId, type RefObject } from 'react'

import { useLatest } from './compose'

export type DismissReason = 'escape' | 'outside'

type Layer = {
  id: string
  content: RefObject<HTMLElement | null>
  /** Кнопка, открывшая слой: клик по ней — не «клик мимо» (она сама закроет слой). */
  trigger?: RefObject<HTMLElement | null>
  dismiss: (reason: DismissReason) => void
  closeOnEscape: boolean
  closeOnOutside: boolean
}

const stack: Layer[] = []

const contains = (layer: Layer, target: Node) => !!layer.content.current?.contains(target) || !!layer.trigger?.current?.contains(target)

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  const top = stack[stack.length - 1]
  if (!top?.closeOnEscape) return
  // Событие обработано: браузер не должен, например, выходить из полноэкранного режима.
  event.preventDefault()
  top.dismiss('escape')
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  // Самый верхний слой, внутри которого кликнули (−1 — кликнули по странице).
  let hit = -1
  for (let i = stack.length - 1; i >= 0; i--) {
    if (contains(stack[i]!, target)) {
      hit = i
      break
    }
  }
  // Закрываем всё, что выше. Копия массива: dismiss меняет стопку.
  for (const layer of stack.slice(hit + 1).reverse()) {
    if (!layer.closeOnOutside) break // слой, который не закрывается кликом мимо, защищает и те, что под ним
    layer.dismiss('outside')
  }
}

function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('keydown', onKeyDown as EventListener)
  // capture: узнаём о нажатии раньше, чем его остановит (stopPropagation) кто-то на странице.
  document[method]('pointerdown', onPointerDown as EventListener, true)
}

/** Цель находится в слое, лежащем выше того, которому принадлежит container. */
export function isInLayerAbove(container: HTMLElement, target: Node) {
  const index = stack.findIndex((layer) => layer.content.current === container || layer.content.current?.contains(container))
  return stack.slice(index + 1).some((layer) => !!layer.content.current?.contains(target))
}

export type UseLayerOptions = {
  open: boolean
  content: RefObject<HTMLElement | null>
  trigger?: RefObject<HTMLElement | null>
  onDismiss: (reason: DismissReason) => void
  closeOnEscape?: boolean
  closeOnOutside?: boolean
}

/** Зарегистрировать открытый слой в стопке. */
export function useLayer({ open, content, trigger, onDismiss, closeOnEscape = true, closeOnOutside = true }: UseLayerOptions) {
  const id = useId()
  const dismiss = useLatest(onDismiss)

  useEffect(() => {
    if (!open) return
    const layer: Layer = { id, content, trigger, closeOnEscape, closeOnOutside, dismiss: (reason) => dismiss.current(reason) }
    if (stack.length === 0) listen(true)
    stack.push(layer)
    return () => {
      const index = stack.indexOf(layer)
      if (index >= 0) stack.splice(index, 1)
      if (stack.length === 0) listen(false)
    }
  }, [open, id, content, trigger, closeOnEscape, closeOnOutside, dismiss])
}

/** Для тестов: сколько слоёв открыто. */
export const layerCount = () => stack.length
