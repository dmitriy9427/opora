/**
 * Переключатель.
 *
 * Тот же невидимый чекбокс, но с role="switch": скринридер скажет «переключатель,
 * включён», а не «флажок, отмечен». Разница в смысле: чекбокс — «выбрать для
 * отправки формы», переключатель — «включить прямо сейчас».
 */
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'

import { cx } from '../../primitives/compose'
import './switch.styles.css'

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children' | 'role'> & {
  /** Подпись справа. Без неё нужен aria-label. */
  children?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function Switch({ children, className, style, ...props }: SwitchProps) {
  return (
    <label className={cx('op-switch', className)} style={style} data-disabled={props.disabled || undefined}>
      {/* Состояние сообщает сам чекбокс (свойство checked) — aria-checked дублировать не нужно. */}
      {/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props */}
      <input type="checkbox" role="switch" className="op-switch__input" {...props} />
      <span className="op-switch__track" aria-hidden>
        <span className="op-switch__thumb" />
      </span>
      {children && <span className="op-switch__label">{children}</span>}
    </label>
  )
}
