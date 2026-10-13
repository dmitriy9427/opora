import type { HTMLAttributes } from 'react'

import { cx } from '../../primitives/compose'
import './badge.styles.css'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

/** Метка-статус. Цвет — подсказка; смысл должен быть в тексте (цвет видят не все). */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cx('op-badge', className)} data-tone={tone} {...props} />
}
