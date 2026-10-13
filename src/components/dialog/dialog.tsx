/**
 * Диалог — модальное окно.
 *
 * «Модальное» значит: пока оно открыто, остальная страница недоступна. Для
 * зрячего пользователя с мышью это делает затемнение. Для всех остальных —
 * пять вещей, которые здесь собраны:
 *
 *   1. role="dialog" + aria-modal + aria-labelledby — скринридер объявляет окно и его название;
 *   2. фокус уходит внутрь и не выходит по Tab (useFocusTrap);
 *   3. всё вне окна получает inert — недоступно ни фокусу, ни скринридеру (useInertOthers);
 *   4. Escape закрывает (useLayer);
 *   5. после закрытия фокус возвращается на кнопку, открывшую окно.
 * Плюс прокрутка страницы под окном заблокирована (useScrollLock).
 *
 * У браузеров есть элемент <dialog> с методом showModal() — он даёт пункты 2–4
 * сам. Здесь всё написано руками, чтобы было видно, из чего это состоит;
 * в своём проекте <dialog> — хороший выбор.
 */
import {
  createContext,
  use,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'

import { composeHandlers, composeRefs, cx, useControllableState } from '../../primitives/compose'
import { useFocusTrap, useInertOthers, useScrollLock } from '../../primitives/focus'
import { useLayer } from '../../primitives/layers'
import { Portal } from '../../primitives/portal'
import { usePresence } from '../../primitives/presence'
import { Slot } from '../../primitives/slot'
import './dialog.styles.css'

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  trigger: RefObject<HTMLButtonElement | null>
  titleId: string
  descriptionId: string
}
const DialogContext = createContext<DialogContextValue | null>(null)

const useDialog = (name: string) => {
  const context = use(DialogContext)
  if (!context) throw new Error(`[opora] <${name}> должен быть внутри <Dialog>`)
  return context
}

export type DialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  return (
    <DialogContext value={{ open: isOpen, setOpen, trigger, titleId: `${id}-title`, descriptionId: `${id}-description` }}>
      {children}
    </DialogContext>
  )
}

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; ref?: Ref<HTMLButtonElement> }

export function DialogTrigger({ asChild = false, onClick, ref, ...props }: TriggerProps) {
  const dialog = useDialog('DialogTrigger')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' as const })}
      aria-haspopup="dialog"
      aria-expanded={dialog.open}
      // Свой ref и ref снаружи (например, от Tooltip вокруг кнопки) — оба получают элемент.
      ref={composeRefs(dialog.trigger, ref) as Ref<never>}
      onClick={composeHandlers(onClick, () => dialog.setOpen(true))}
      {...(props as object)}
    />
  )
}

/** Кнопка, закрывающая диалог («Отмена», «Готово»). */
export function DialogClose({ asChild = false, onClick, ...props }: TriggerProps) {
  const dialog = useDialog('DialogClose')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' as const })}
      onClick={composeHandlers(onClick, () => dialog.setOpen(false))}
      {...(props as object)}
    />
  )
}

export type DialogContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> & {
  /** Заголовок окна. Обязателен: без названия скринридер объявит просто «диалог». */
  title: ReactNode
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /**
   * alertdialog — окно, требующее ответа («Удалить файл?»). Не закрывается
   * кликом мимо: решение нужно принять явно.
   */
  role?: 'dialog' | 'alertdialog'
  /** Закрывать кликом по затемнению. По умолчанию — да для dialog и нет для alertdialog. */
  closeOnOutside?: boolean
  /** Скрыть крестик (у окна должна остаться другая кнопка закрытия). */
  hideClose?: boolean
  /** Кнопки внизу окна. */
  footer?: ReactNode
}

export function DialogContent({
  title,
  description,
  size = 'md',
  role = 'dialog',
  closeOnOutside = role === 'dialog',
  hideClose = false,
  footer,
  className,
  children,
  ref,
  ...props
}: DialogContentProps & { ref?: React.Ref<HTMLDivElement> }) {
  const dialog = useDialog('DialogContent')
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const presence = usePresence(dialog.open)

  // Клик по затемнению обрабатываем сами (ниже), поэтому стопке слоёв «клик мимо» не нужен.
  useLayer({ open: dialog.open, content: root, onDismiss: () => dialog.setOpen(false), closeOnOutside: false })
  // Порядок важен. Очистка эффектов идёт в порядке их объявления: сначала страница перестаёт
  // быть inert, и только потом ловушка возвращает фокус на кнопку. Наоборот — фокус пытался бы
  // встать на элемент, который ещё выключен, и молча терялся бы (уходил на <body>).
  useInertOthers(root, dialog.open)
  useFocusTrap(panel, dialog.open)
  useScrollLock(dialog.open)

  if (!presence.present) return null

  return (
    <Portal>
      <div className="op-dialog" data-state={presence.state} ref={composeRefs(root, presence.ref)}>
        <div
          className="op-dialog__backdrop"
          // pointerdown, а не click: выделение текста в окне, законченное за его пределами, не должно его закрывать.
          onPointerDown={() => closeOnOutside && dialog.setOpen(false)}
        />
        <div
          role={role}
          aria-modal="true"
          aria-labelledby={dialog.titleId}
          aria-describedby={description ? dialog.descriptionId : undefined}
          // tabIndex -1: панель может получить фокус программно (если внутри нет кнопок), но не участвует в обходе Tab.
          tabIndex={-1}
          className={cx('op-dialog__panel', className)}
          data-size={size}
          ref={composeRefs(panel, ref)}
          {...props}
        >
          <header className="op-dialog__header">
            <h2 className="op-dialog__title" id={dialog.titleId}>
              {title}
            </h2>
            {!hideClose && (
              <button type="button" className="op-dialog__close" aria-label="Закрыть" onClick={() => dialog.setOpen(false)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </header>
          {description && (
            <p className="op-dialog__description" id={dialog.descriptionId}>
              {description}
            </p>
          )}
          {children && <div className="op-dialog__body">{children}</div>}
          {footer && <footer className="op-dialog__footer">{footer}</footer>}
        </div>
      </div>
    </Portal>
  )
}
