/**
 * Навигация стрелками по набору элементов: вкладки, пункты меню, заголовки аккордеона.
 *
 * Общее правило клавиатуры для составных виджетов (WAI-ARIA): Tab входит в
 * виджет и выходит из него, а ВНУТРИ перемещаются стрелками. Иначе, чтобы
 * пройти мимо меню из 20 пунктов, пришлось бы нажать Tab 20 раз.
 */
import { useRef, type KeyboardEvent } from 'react'

export type Orientation = 'horizontal' | 'vertical'

/** Какой элемент станет текущим после нажатия клавиши; null — клавиша не про навигацию. */
export function nextIndex(
  key: string,
  current: number,
  count: number,
  { orientation, loop = true }: { orientation: Orientation; loop?: boolean },
): number | null {
  if (count === 0) return null
  const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  const step = (delta: number) => {
    const index = current + delta
    if (loop) return (index + count) % count
    return Math.min(Math.max(index, 0), count - 1)
  }
  if (key === next) return current < 0 ? 0 : step(1)
  if (key === prev) return current < 0 ? count - 1 : step(-1)
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

/** Доступные (не выключенные) элементы набора внутри контейнера, в порядке DOM. */
export const getItems = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (item) => !item.hasAttribute('data-disabled') && !(item as HTMLButtonElement).disabled,
  )

/**
 * Обработчик onKeyDown для контейнера: стрелки переносят фокус между элементами.
 * Элементы ищутся в DOM по селектору — компоненту не нужно вести их список самому.
 */
export function moveFocus(event: KeyboardEvent<HTMLElement>, selector: string, options: { orientation: Orientation; loop?: boolean }) {
  const items = getItems(event.currentTarget, selector)
  const current = items.indexOf(document.activeElement as HTMLElement)
  const index = nextIndex(event.key, current, items.length, options)
  if (index === null) return null
  // Стрелки и Home/End не должны прокручивать страницу.
  event.preventDefault()
  items[index]?.focus()
  return items[index] ?? null
}

/**
 * Поиск по первым буквам: в открытом меню или списке набираешь «мо» — фокус
 * прыгает на «Москва». Буквы копятся, пока между нажатиями меньше 500 мс.
 * Повтор одной буквы («ммм») перебирает элементы на эту букву по кругу.
 */
export function useTypeahead() {
  const state = useRef({ text: '', at: 0 })

  return (key: string, labels: string[], current: number): number => {
    // Одиночный печатный символ; пробел в начале — это «выбрать», а не поиск.
    if (key.length !== 1 || (key === ' ' && state.current.text === '')) return -1
    const now = Date.now()
    const text = now - state.current.at > 500 ? key : state.current.text + key
    state.current = { text, at: now }

    const normalized = labels.map((label) => label.trim().toLowerCase())
    const query = text.toLowerCase()
    const sameLetter = query.split('').every((char) => char === query[0])
    // «ммм» — искать по одной букве, начиная со следующего элемента; «мо» — с текущего.
    const needle = sameLetter ? query[0]! : query
    const start = sameLetter ? current + 1 : Math.max(current, 0)
    for (let i = 0; i < normalized.length; i++) {
      const index = (start + i) % normalized.length
      if (normalized[index]!.startsWith(needle)) return index
    }
    return -1
  }
}
