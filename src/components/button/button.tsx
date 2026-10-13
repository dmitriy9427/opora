import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'

import { cx } from '../../primitives/compose'
import { Slot } from '../../primitives/slot'
import { Spinner } from '../spinner/spinner'
import './button.styles.css'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Идёт действие: показать индикатор и не принимать нажатия. */
  loading?: boolean
  /** Кнопка из одного значка: квадратная. Обязателен aria-label. */
  iconOnly?: boolean
  /** Значок перед текстом. */
  icon?: ReactNode
  /** Не рисовать <button>, а передать вид и поведение ребёнку (например, ссылке). */
  asChild?: boolean
  ref?: Ref<HTMLButtonElement>
}

/**
 * Кнопка.
 *
 * Про состояние loading. Атрибут disabled убрал бы кнопку из обхода клавишей
 * Tab — фокус «провалился» бы, а скринридер не объяснил бы почему. Поэтому
 * кнопка остаётся в фокусе, получает aria-disabled и aria-busy, а нажатия
 * просто не выполняются.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  iconOnly = false,
  icon,
  asChild = false,
  className,
  children,
  onClick,
  type,
  disabled,
  ...props
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) return event.preventDefault()
    onClick?.(event)
  }

  const shared = {
    className: cx('op-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-icon-only': iconOnly || undefined,
    'data-loading': loading || undefined,
    'aria-busy': loading || undefined,
    'aria-disabled': loading || undefined,
    onClick: handleClick,
    ...props,
  }

  // С asChild содержимое принадлежит ребёнку — индикатор и значок внутрь не вставляем.
  if (asChild) return <Slot {...(shared as object)}>{children}</Slot>

  return (
    // type="button" по умолчанию: у <button> в форме тип по умолчанию submit — случайная кнопка отправляла бы форму.
    <button type={type ?? 'button'} disabled={disabled} {...shared}>
      {loading ? <Spinner size="sm" label="" /> : icon}
      {children}
    </button>
  )
}
