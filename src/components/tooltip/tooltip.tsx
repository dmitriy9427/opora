/**
 * Подсказка — короткий текст при наведении или фокусе.
 *
 *   <Tooltip content="Удалить"><Button iconOnly aria-label="Удалить">…</Button></Tooltip>
 *
 * Правила, которые здесь соблюдены (WCAG 1.4.13 «Содержимое по наведению или фокусу»):
 *   - появляется и по наведению, и по фокусу с клавиатуры — иначе без мыши её не увидеть;
 *   - закрывается клавишей Escape, не уводя фокус;
 *   - на саму подсказку можно навести курсор — она не исчезает (читают с увеличением экрана);
 *   - связана с элементом через aria-describedby — скринридер зачитает её после названия.
 *
 * Чего подсказка НЕ должна делать: содержать кнопки и ссылки (для этого Popover) и
 * быть единственным местом, где написано важное, — на телефоне наведения нет.
 */
import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'

import { composeRefs, cx } from '../../primitives/compose'
import { Portal } from '../../primitives/portal'
import { usePosition, type Placement } from '../../primitives/position'
import { mergeProps } from '../../primitives/slot'
import './tooltip.styles.css'

export type TooltipProps = {
  content: ReactNode
  /** Один элемент, к которому относится подсказка. Он должен уметь получать фокус. */
  children: ReactElement<Record<string, unknown>>
  placement?: Placement
  /** Задержка перед показом по наведению, мс. По фокусу подсказка появляется сразу. */
  delay?: number
  /** Не показывать (например, когда текст кнопки и так виден). */
  disabled?: boolean
}

export function Tooltip({ content, children, placement = 'top', delay = 400, disabled = false }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLElement>(null)
  const floating = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const position = usePosition(anchor, floating, { open, placement, offset: 8 })

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const show = (wait: number) => {
    clear()
    if (disabled) return
    if (wait === 0) setOpen(true)
    else timer.current = setTimeout(() => setOpen(true), wait)
  }
  const hide = (wait = 0) => {
    clear()
    if (wait === 0) setOpen(false)
    // Небольшая пауза перед скрытием: успеть перевести курсор с кнопки на саму подсказку.
    else timer.current = setTimeout(() => setOpen(false), wait)
  }

  useEffect(() => clear, [])

  // Escape скрывает подсказку. Слушаем на document: фокус может быть где угодно.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const child = cloneElement(children, {
    ...mergeProps(
      {
        // Касание пальцем не считается наведением: на телефоне подсказка мешала бы нажатию.
        onPointerEnter: (event: React.PointerEvent) => event.pointerType !== 'touch' && show(delay),
        onPointerLeave: () => hide(100),
        onFocus: (event: React.FocusEvent) => {
          // Только при фокусе с клавиатуры: после клика мышью подсказка не нужна.
          if ((event.target as HTMLElement).matches(':focus-visible')) show(0)
        },
        onBlur: () => hide(),
        // Нажали — действие выполнено, подсказка больше не нужна.
        onPointerDown: () => hide(),
      },
      children.props,
    ),
    'aria-describedby': [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') || undefined,
    ref: composeRefs(anchor, (children.props as { ref?: React.Ref<HTMLElement> }).ref),
  })

  return (
    <>
      {child}
      {open && !disabled && (
        <Portal>
          <div
            role="tooltip"
            id={id}
            className={cx('op-tooltip')}
            data-side={position.side}
            style={position.style}
            ref={floating}
            onPointerEnter={clear}
            onPointerLeave={() => hide(100)}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  )
}
