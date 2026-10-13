/**
 * Работа с фокусом.
 *
 * Фокус — «курсор» клавиатуры. Для человека без мыши (и для скринридера)
 * правильное управление фокусом — это и есть возможность пользоваться
 * интерфейсом: открыл диалог — фокус внутри; закрыл — фокус вернулся туда,
 * откуда ушёл.
 */
import { useEffect, type RefObject } from 'react'

import { isInLayerAbove } from './layers'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

/** Элементы внутри контейнера, до которых можно дойти клавишей Tab, в порядке обхода. */
export function getTabbable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // inert и hidden исключают элемент из обхода, даже если он подходит по селектору.
    (element) => !element.closest('[inert], [hidden]') && element.getAttribute('aria-hidden') !== 'true',
  )
}

/**
 * Ловушка фокуса для модального окна.
 *
 *   - при открытии фокус уходит внутрь (на элемент с autofocus, первый
 *     доступный или сам контейнер);
 *   - Tab на последнем элементе ведёт на первый, Shift+Tab на первом — на последний;
 *   - при закрытии фокус возвращается туда, где был до открытия.
 *
 * Без ловушки Tab уводит «под» окно — на элементы страницы, которых не видно.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    // Кто был в фокусе до нас — туда и вернёмся.
    const previous = document.activeElement as HTMLElement | null

    const initial = container.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ?? getTabbable(container)[0] ?? container
    initial.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const tabbable = getTabbable(container)
      if (tabbable.length === 0) {
        // Нечего обходить — фокус остаётся на контейнере.
        event.preventDefault()
        return
      }
      const first = tabbable[0]!
      const last = tabbable[tabbable.length - 1]!
      const current = document.activeElement
      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    // Фокус мог уйти наружу не клавишей Tab (программно, скринридером) — возвращаем.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node
      // Слой выше (меню или селект, открытые из диалога) живёт в портале вне контейнера — это не «побег».
      if (container.contains(target) || isInLayerAbove(container, target)) return
      ;(getTabbable(container)[0] ?? container).focus()
    }

    container.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      // Элемента уже может не быть на странице (например, удалили строку, из которой открыли диалог).
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [ref, active])
}

/**
 * Сделать всё, кроме контейнера, недоступным: атрибут inert выключает
 * клики, фокус и чтение скринридером для всего поддерева.
 *
 * Идём от контейнера вверх и на каждом уровне выключаем «братьев» — так
 * выключено всё, кроме ветки с самим контейнером.
 */
export function useInertOthers(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const changed: HTMLElement[] = []
    let node: HTMLElement | null = container
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement
      if (!parent) break
      for (const sibling of Array.from(parent.children) as HTMLElement[]) {
        // Слои выше (тосты, вложенные диалоги) и уже выключенное не трогаем.
        if (sibling === node || sibling.hasAttribute('inert') || sibling.hasAttribute('data-op-keep')) continue
        sibling.setAttribute('inert', '')
        changed.push(sibling)
      }
      node = parent
    }
    return () => {
      for (const element of changed) element.removeAttribute('inert')
    }
  }, [ref, active])
}

let locks = 0
let restore: (() => void) | null = null

/**
 * Запретить прокрутку страницы, пока открыто модальное окно.
 * Счётчик: два окна друг над другом — прокрутка вернётся, когда закрыты оба.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (locks++ === 0) {
      const { style } = document.body
      const previous = { overflow: style.overflow, paddingRight: style.paddingRight }
      // Полоса прокрутки исчезнет — страница дёрнулась бы вправо. Компенсируем её ширину отступом.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      style.overflow = 'hidden'
      if (scrollbar > 0) style.paddingRight = `calc(${getComputedStyle(document.body).paddingRight} + ${scrollbar}px)`
      restore = () => {
        style.overflow = previous.overflow
        style.paddingRight = previous.paddingRight
      }
    }
    return () => {
      if (--locks === 0) {
        restore?.()
        restore = null
      }
    }
  }, [active])
}
