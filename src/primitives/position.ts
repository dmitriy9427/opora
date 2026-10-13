/**
 * Позиционирование всплывающего элемента у якоря (кнопки).
 *
 * Задача: поставить поповер «под кнопкой по левому краю» — и не дать ему
 * вылезти за экран. Два приёма:
 *
 *   flip  — не помещается снизу → ставим сверху (и наоборот);
 *   shift — вылезает сбоку → сдвигаем вдоль стороны, пока не поместится.
 *
 * Расчёт — чистая функция от прямоугольников: её проверяют тесты без браузера.
 * Хук только измеряет элементы и пересчитывает при прокрутке и изменении размеров.
 *
 * (В браузерах появляется CSS Anchor Positioning — то же самое средствами CSS.
 * Когда поддержка станет повсеместной, этот файл можно будет удалить.)
 */
import { useCallback, useState, type CSSProperties, type RefObject } from 'react'

import { useIsomorphicLayoutEffect } from './compose'

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'
export type Placement = Side | `${Side}-${Exclude<Align, 'center'>}`

type Rect = { x: number; y: number; width: number; height: number }
type Size = { width: number; height: number }

export type PositionInput = {
  anchor: Rect
  floating: Size
  viewport: Size
  placement: Placement
  /** Зазор между якорем и всплывающим элементом. */
  offset?: number
  /** Минимальный отступ от краёв экрана. */
  padding?: number
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

const parse = (placement: Placement): [Side, Align] => {
  const [side, align = 'center'] = placement.split('-') as [Side, Align?]
  return [side, align]
}

/** Координаты для заданной стороны и выравнивания — без учёта краёв экрана. */
function place(anchor: Rect, floating: Size, side: Side, align: Align, offset: number) {
  const vertical = side === 'top' || side === 'bottom'
  // Вдоль стороны: по началу, центру или концу якоря.
  const along = (start: number, anchorSize: number, size: number) =>
    align === 'start' ? start : align === 'end' ? start + anchorSize - size : start + (anchorSize - size) / 2
  return {
    x: vertical
      ? along(anchor.x, anchor.width, floating.width)
      : side === 'left'
        ? anchor.x - floating.width - offset
        : anchor.x + anchor.width + offset,
    y: vertical
      ? side === 'top'
        ? anchor.y - floating.height - offset
        : anchor.y + anchor.height + offset
      : along(anchor.y, anchor.height, floating.height),
  }
}

/** Сколько места есть с данной стороны якоря. */
const space = (anchor: Rect, viewport: Size, side: Side) =>
  side === 'top'
    ? anchor.y
    : side === 'bottom'
      ? viewport.height - anchor.y - anchor.height
      : side === 'left'
        ? anchor.x
        : viewport.width - anchor.x - anchor.width

export function computePosition({ anchor, floating, viewport, placement, offset = 8, padding = 8 }: PositionInput) {
  let [side, align] = parse(placement)
  const vertical = side === 'top' || side === 'bottom'
  const needed = (vertical ? floating.height : floating.width) + offset + padding

  // flip: на нужной стороне тесно, а на противоположной места больше — переворачиваем.
  if (space(anchor, viewport, side) < needed && space(anchor, viewport, OPPOSITE[side]) > space(anchor, viewport, side))
    side = OPPOSITE[side]

  let { x, y } = place(anchor, floating, side, align, offset)

  // shift: вдоль стороны прижимаем к границам экрана.
  const clamp = (value: number, size: number, limit: number) =>
    Math.min(Math.max(value, padding), Math.max(padding, limit - size - padding))
  if (vertical) x = clamp(x, floating.width, viewport.width)
  else y = clamp(y, floating.height, viewport.height)

  // Сколько места в выбранную сторону: если элемент выше — ему ограничат высоту и включат прокрутку.
  const available = Math.max(0, Math.round(space(anchor, viewport, side) - offset - padding))

  return { x: Math.round(x), y: Math.round(y), side, align, available }
}

export type UsePositionOptions = {
  open: boolean
  placement?: Placement
  offset?: number
  /** Сделать всплывающий элемент не уже якоря (для селекта). */
  matchWidth?: boolean
}

/**
 * Держать всплывающий элемент у якоря, пока он открыт.
 * Возвращает стиль (position: fixed + координаты) и фактическую сторону.
 */
export function usePosition(
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  { open, placement = 'bottom-start', offset = 6, matchWidth = false }: UsePositionOptions,
) {
  const [result, setResult] = useState<{ x: number; y: number; side: Side; available: number; width?: number } | null>(null)

  const update = useCallback(() => {
    const anchorEl = anchor.current
    const floatingEl = floating.current
    if (!anchorEl || !floatingEl) return
    const rect = anchorEl.getBoundingClientRect()
    const next = computePosition({
      anchor: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      floating: { width: Math.max(floatingEl.offsetWidth, matchWidth ? rect.width : 0), height: floatingEl.offsetHeight },
      viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
      placement,
      offset,
    })
    const width = matchWidth ? rect.width : undefined
    // Новый объект — только если что-то изменилось: иначе прокрутка вызывала бы рендер на каждый кадр.
    setResult((prev) =>
      prev && prev.x === next.x && prev.y === next.y && prev.side === next.side && prev.available === next.available && prev.width === width
        ? prev
        : { x: next.x, y: next.y, side: next.side, available: next.available, width },
    )
  }, [anchor, floating, placement, offset, matchWidth])

  // Layout-эффект: координаты нужны ДО отрисовки, иначе элемент мигнёт в углу экрана.
  useIsomorphicLayoutEffect(() => {
    if (!open) return setResult(null)
    update()
    // capture: событие scroll не всплывает, а прокручиваться может любой предок якоря.
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    // Размер самого всплывающего элемента мог измениться (догрузилось содержимое).
    const observer = new ResizeObserver(update)
    if (floating.current) observer.observe(floating.current)
    if (anchor.current) observer.observe(anchor.current)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [open, update, anchor, floating])

  const style = {
    position: 'fixed',
    left: result?.x ?? 0,
    top: result?.y ?? 0,
    minWidth: result?.width,
    // Доступная высота — в CSS-переменную: компонент сам решает, как её использовать (max-height списка).
    '--op-available-height': result ? `${result.available}px` : undefined,
    // Пока координаты не посчитаны, элемент в DOM (его нужно измерить), но не виден. Именно opacity,
    // а не visibility: hidden — скрытый так элемент нельзя сфокусировать, а меню ставит фокус на пункт
    // сразу при открытии. Анимация появления тоже ждёт — иначе она началась бы в углу экрана.
    ...(result ? null : { opacity: 0, animation: 'none', pointerEvents: 'none' }),
  } as CSSProperties
  return { style, side: result?.side ?? parse(placement)[0] }
}
