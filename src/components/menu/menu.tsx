/**
 * Меню действий (выпадающее меню).
 *
 * Роли: кнопка с aria-haspopup="menu" → role="menu" → role="menuitem".
 * Клавиатура (WAI-ARIA, шаблон Menu Button):
 *   на кнопке:  Enter, Пробел, ↓ — открыть, фокус на первом пункте; ↑ — на последнем;
 *   в меню:     ↑ ↓ — по пунктам (по кругу), Home / End, буквы — поиск по первым буквам,
 *               Enter / Пробел — выбрать, Escape — закрыть, Tab — закрыть и идти дальше.
 * После закрытия фокус возвращается на кнопку.
 *
 * Важно: role="menu" — это меню ДЕЙСТВИЙ («Переименовать», «Удалить»), как в
 * приложениях. Навигация сайта — это <nav> со ссылками, а не role="menu".
 */
import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'

import { composeHandlers, composeRefs, cx, useControllableState } from '../../primitives/compose'
import { useLayer } from '../../primitives/layers'
import { getItems, moveFocus, useTypeahead } from '../../primitives/list'
import { Portal } from '../../primitives/portal'
import { usePosition, type Placement } from '../../primitives/position'
import { usePresence } from '../../primitives/presence'
import { Slot } from '../../primitives/slot'
import './menu.styles.css'

const ITEM = '[role^="menuitem"]'

type MenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  trigger: RefObject<HTMLButtonElement | null>
  triggerId: string
  contentId: string
  /** С какого пункта начать при открытии: клавиша ↑ на кнопке открывает меню с конца. */
  startFrom: RefObject<'first' | 'last'>
}
const MenuContext = createContext<MenuContextValue | null>(null)

const useMenu = (name: string) => {
  const context = use(MenuContext)
  if (!context) throw new Error(`[opora] <${name}> должен быть внутри <Menu>`)
  return context
}

export type MenuProps = { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }

export function Menu({ open, defaultOpen = false, onOpenChange, children }: MenuProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const trigger = useRef<HTMLButtonElement>(null)
  const startFrom = useRef<'first' | 'last'>('first')
  const id = useId()
  return (
    <MenuContext value={{ open: isOpen, setOpen, trigger, triggerId: `${id}-trigger`, contentId: `${id}-menu`, startFrom }}>
      {children}
    </MenuContext>
  )
}

export function MenuTrigger({
  asChild = false,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; ref?: Ref<HTMLButtonElement> }) {
  const menu = useMenu('MenuTrigger')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' as const })}
      id={menu.triggerId}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      aria-controls={menu.open ? menu.contentId : undefined}
      // Свой ref и ref снаружи (например, от Tooltip вокруг кнопки) — оба получают элемент.
      ref={composeRefs(menu.trigger, ref) as Ref<never>}
      onClick={composeHandlers(onClick, () => {
        menu.startFrom.current = 'first'
        menu.setOpen(!menu.open)
      })}
      onKeyDown={composeHandlers(onKeyDown as ((event: KeyboardEvent<HTMLElement>) => void) | undefined, (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault() // иначе стрелка прокрутит страницу
        menu.startFrom.current = event.key === 'ArrowUp' ? 'last' : 'first'
        menu.setOpen(true)
      })}
      {...(props as object)}
    />
  )
}

export type MenuContentProps = HTMLAttributes<HTMLDivElement> & { placement?: Placement; ref?: Ref<HTMLDivElement> }

export function MenuContent({ placement = 'bottom-start', className, style, onKeyDown, children, ref, ...props }: MenuContentProps) {
  const menu = useMenu('MenuContent')
  const content = useRef<HTMLDivElement>(null)
  const presence = usePresence(menu.open)
  const position = usePosition(menu.trigger, content, { open: presence.present, placement, offset: 4 })
  const typeahead = useTypeahead()

  useLayer({ open: menu.open, content, trigger: menu.trigger, onDismiss: () => menu.setOpen(false) })

  // Открылось — фокус на первый (или последний) пункт; закрылось — обратно на кнопку.
  useEffect(() => {
    const element = content.current
    if (!menu.open || !element) return
    const items = getItems(element, ITEM)
    ;(menu.startFrom.current === 'last' ? items[items.length - 1] : items[0])?.focus({ preventScroll: true })
    const trigger = menu.trigger.current
    return () => {
      if (element.contains(document.activeElement) || document.activeElement === document.body) trigger?.focus({ preventScroll: true })
    }
  }, [menu.open, menu.trigger, menu.startFrom])

  if (!presence.present) return null

  return (
    <Portal>
      <div
        role="menu"
        id={menu.contentId}
        aria-labelledby={menu.triggerId}
        aria-orientation="vertical"
        tabIndex={-1}
        className={cx('op-menu', className)}
        data-state={presence.state}
        data-side={position.side}
        style={{ ...position.style, ...style }}
        ref={composeRefs(content, presence.ref, ref)}
        onKeyDown={composeHandlers(onKeyDown, (event) => {
          // Tab не ходит по пунктам меню: он закрывает меню и идёт дальше по странице.
          if (event.key === 'Tab') return menu.setOpen(false)
          if (moveFocus(event, ITEM, { orientation: 'vertical' })) return
          const items = getItems(event.currentTarget, ITEM)
          const found = typeahead(
            event.key,
            items.map((item) => item.textContent ?? ''),
            items.indexOf(document.activeElement as HTMLElement),
          )
          if (found >= 0) items[found]?.focus()
        })}
        {...props}
      >
        {children}
      </div>
    </Portal>
  )
}

export type MenuItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  /** Пункт выбран (клик, Enter или Пробел). event.preventDefault() оставит меню открытым. */
  onSelect?: (event: Event) => void
  disabled?: boolean
  /** Опасное действие (удаление) — выделяется цветом. */
  danger?: boolean
  icon?: ReactNode
  /** Подсказка о сочетании клавиш справа: «⌘K». Только текст — само сочетание меню не обрабатывает. */
  shortcut?: string
}

function useItem({ onSelect, disabled, closeOnSelect }: { onSelect?: (event: Event) => void; disabled?: boolean; closeOnSelect: boolean }) {
  const menu = useMenu('MenuItem')
  const select = () => {
    if (disabled) return
    // Своё отменяемое событие «выбор»: одинаковое для клика и клавиши. Исходное событие клавиши
    // для этого не годится — у него мы сами вызываем preventDefault (чтобы Пробел не прокрутил страницу).
    const event = new Event('select', { cancelable: true })
    onSelect?.(event)
    if (closeOnSelect && !event.defaultPrevented) menu.setOpen(false)
  }
  return {
    // Пункты не участвуют в обходе Tab — по ним ходят стрелками.
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    'data-disabled': disabled ? '' : undefined,
    onClick: select,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault() // Пробел не должен прокрутить страницу
      select()
    },
    // В меню наведение = фокус: подсветка одна, а не две (под курсором и под клавиатурой).
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!disabled && event.pointerType === 'mouse') event.currentTarget.focus({ preventScroll: true })
    },
  }
}

export function MenuItem({ onSelect, disabled, danger, icon, shortcut, className, children, ...props }: MenuItemProps) {
  const item = useItem({ onSelect, disabled, closeOnSelect: true })
  return (
    <div role="menuitem" className={cx('op-menu__item', className)} data-danger={danger || undefined} {...item} {...props}>
      {icon && (
        <span className="op-menu__icon" aria-hidden>
          {icon}
        </span>
      )}
      <span className="op-menu__text">{children}</span>
      {shortcut && (
        <span className="op-menu__shortcut" aria-hidden>
          {shortcut}
        </span>
      )}
    </div>
  )
}

export type MenuCheckboxItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** Пункт-флажок («Показывать сетку»). Меню после выбора не закрывается: обычно отмечают несколько. */
export function MenuCheckboxItem({ checked, onCheckedChange, disabled, className, children, ...props }: MenuCheckboxItemProps) {
  const item = useItem({ onSelect: () => onCheckedChange(!checked), disabled, closeOnSelect: false })
  return (
    <div role="menuitemcheckbox" aria-checked={checked} className={cx('op-menu__item', className)} {...item} {...props}>
      <span className="op-menu__icon" aria-hidden>
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
      <span className="op-menu__text">{children}</span>
    </div>
  )
}

/** Группа пунктов с подписью. */
export function MenuGroup({ label, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'role'> & { label: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} {...props}>
      <div className="op-menu__label" id={id}>
        {label}
      </div>
      {children}
    </div>
  )
}

export function MenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cx('op-menu__separator', className)} {...props} />
}
