/**
 * Поповер — всплывающая панель у кнопки, НЕ модальная.
 *
 * Отличия от диалога: страница под ним остаётся доступной, фокус не заперт,
 * клик мимо закрывает. Отличие от подсказки (Tooltip): внутри могут быть
 * кнопки и поля, открывается по нажатию, а не по наведению.
 *
 * Фокус: при открытии переходит внутрь; при закрытии — возвращается на кнопку,
 * если он был внутри (если человек уже кликнул в другое место — не отбираем).
 */
import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'

import { composeHandlers, composeRefs, cx, useControllableState } from '../../primitives/compose'
import { getTabbable } from '../../primitives/focus'
import { useLayer } from '../../primitives/layers'
import { Portal } from '../../primitives/portal'
import { usePosition, type Placement } from '../../primitives/position'
import { usePresence } from '../../primitives/presence'
import { Slot } from '../../primitives/slot'
import './popover.styles.css'

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  trigger: RefObject<HTMLButtonElement | null>
  contentId: string
}
const PopoverContext = createContext<PopoverContextValue | null>(null)

const usePopover = (name: string) => {
  const context = use(PopoverContext)
  if (!context) throw new Error(`[opora] <${name}> должен быть внутри <Popover>`)
  return context
}

export type PopoverProps = {
  /** Открыт ли поповер (управляемый режим). */
  open?: boolean
  /** Открыть при первом показе. */
  defaultOpen?: boolean
  /** Вызывается при открытии и закрытии. */
  onOpenChange?: (open: boolean) => void
  /** PopoverTrigger и PopoverContent. */
  children: ReactNode
}

export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const trigger = useRef<HTMLButtonElement>(null)
  return <PopoverContext value={{ open: isOpen, setOpen, trigger, contentId: useId() }}>{children}</PopoverContext>
}

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; ref?: Ref<HTMLButtonElement> }

export function PopoverTrigger({ asChild = false, onClick, ref, ...props }: TriggerProps) {
  const popover = usePopover('PopoverTrigger')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' as const })}
      aria-haspopup="dialog"
      aria-expanded={popover.open}
      aria-controls={popover.open ? popover.contentId : undefined}
      // Свой ref и ref снаружи (например, от Tooltip вокруг кнопки) — оба получают элемент.
      ref={composeRefs(popover.trigger, ref) as Ref<never>}
      onClick={composeHandlers(onClick, () => popover.setOpen(!popover.open))}
      {...(props as object)}
    />
  )
}

export function PopoverClose({ asChild = false, onClick, ...props }: TriggerProps) {
  const popover = usePopover('PopoverClose')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' as const })}
      onClick={composeHandlers(onClick, () => popover.setOpen(false))}
      {...(props as object)}
    />
  )
}

export type PopoverContentProps = HTMLAttributes<HTMLDivElement> & {
  /** С какой стороны кнопки и как выровнять: 'bottom-start', 'top', 'right-end'… Не помещается — перевернётся. */
  placement?: Placement
  /** Зазор между кнопкой и панелью, px. */
  offset?: number
  ref?: Ref<HTMLDivElement>
}

export function PopoverContent({ placement = 'bottom-start', offset, className, style, children, ref, ...props }: PopoverContentProps) {
  const popover = usePopover('PopoverContent')
  const content = useRef<HTMLDivElement>(null)
  const presence = usePresence(popover.open)
  const position = usePosition(popover.trigger, content, { open: presence.present, placement, offset })

  useLayer({ open: popover.open, content, trigger: popover.trigger, onDismiss: () => popover.setOpen(false) })

  useEffect(() => {
    const element = content.current
    if (!popover.open || !element) return
    ;(getTabbable(element)[0] ?? element).focus({ preventScroll: true })
    const trigger = popover.trigger.current
    return () => {
      // Возвращаем фокус, только если он оставался внутри: иначе человек уже занят чем-то другим.
      if (element.contains(document.activeElement)) trigger?.focus({ preventScroll: true })
    }
  }, [popover.open, popover.trigger])

  if (!presence.present) return null

  return (
    <Portal>
      <div
        // Немодальный диалог: роль есть, aria-modal нет. Название — через aria-label или aria-labelledby от пользователя.
        role="dialog"
        id={popover.contentId}
        tabIndex={-1}
        className={cx('op-popover', className)}
        data-state={presence.state}
        data-side={position.side}
        style={{ ...position.style, ...style }}
        ref={composeRefs(content, presence.ref, ref)}
        {...props}
      >
        {children}
      </div>
    </Portal>
  )
}
