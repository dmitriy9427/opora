/**
 * Чекбокс.
 *
 * Внутри — настоящий <input type="checkbox">, просто невидимый, а «коробочка»
 * нарисована рядом. Это главный приём для элементов форм: поведение (клавиша
 * Пробел, отправка в форме, required, автозаполнение, чтение скринридером)
 * даёт браузер, а мы меняем только внешний вид. <div role="checkbox">
 * потребовал бы написать всё это заново — и где-нибудь ошибиться.
 */
import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'

import { composeRefs, cx } from '../../primitives/compose'
import './checkbox.styles.css'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  /** Подпись справа. Без неё нужен aria-label. */
  children?: ReactNode
  /** «Частично»: например, выбрана часть строк таблицы. Это вид, а не значение. */
  indeterminate?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Checkbox({ children, indeterminate = false, className, style, ref, ...props }: CheckboxProps) {
  const inner = useRef<HTMLInputElement>(null)

  // indeterminate нельзя задать атрибутом в разметке — только свойством DOM-элемента.
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    // <label> вокруг: клик по тексту переключает чекбокс, а область нажатия — вся строка.
    <label className={cx('op-checkbox', className)} style={style} data-disabled={props.disabled || undefined}>
      <input type="checkbox" className="op-checkbox__input" ref={composeRefs(inner, ref)} {...props} />
      <span className="op-checkbox__box" aria-hidden>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path className="op-checkbox__check" d="M3.5 8.5l3 3 6-7" />
          <path className="op-checkbox__dash" d="M4 8h8" />
        </svg>
      </span>
      {children && <span className="op-checkbox__label">{children}</span>}
    </label>
  )
}
