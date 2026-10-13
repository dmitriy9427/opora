import type { HTMLAttributes } from 'react'

import { cx } from '../../primitives/compose'
import './spinner.styles.css'

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: 'sm' | 'md' | 'lg'
  /** Что сказать скринридеру. Пустая строка — индикатор декоративный (рядом уже есть текст «Загрузка»). */
  label?: string
}

/** Индикатор загрузки. */
export function Spinner({ size = 'md', label = 'Загрузка', className, ...props }: SpinnerProps) {
  return (
    // role="status" — «живая область»: скринридер сам зачитает подпись, когда индикатор появится.
    <span
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      className={cx('op-spinner', className)}
      data-size={size}
      {...props}
    >
      {label && <span className="op-visually-hidden">{label}</span>}
    </span>
  )
}
