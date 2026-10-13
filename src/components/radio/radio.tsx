/**
 * Радиогруппа: выбор одного из нескольких.
 *
 * Снова настоящие <input type="radio"> с общим name. Браузер сам даёт всё, что
 * положено радиогруппе: Tab входит в группу один раз, стрелки переключают
 * вариант, в форму уходит одно значение.
 *
 * <fieldset> + <legend> — подпись всей группы: скринридер читает «Доставка,
 * группа. Курьер, переключатель, 1 из 3».
 */
import { createContext, use, useId, type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'

import { cx, useControllableState } from '../../primitives/compose'
import './radio.styles.css'

type RadioContextValue = { name: string; value: string | null; onChange: (value: string) => void; disabled: boolean; required: boolean }
const RadioContext = createContext<RadioContextValue | null>(null)

export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue'> & {
  /** Подпись группы. */
  label: ReactNode
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** Имя поля формы; не задано — сгенерируется. */
  name?: string
  orientation?: 'vertical' | 'horizontal'
  required?: boolean
  error?: ReactNode
}

export function RadioGroup({
  label,
  value,
  defaultValue = null,
  onValueChange,
  name,
  orientation = 'vertical',
  required = false,
  disabled = false,
  error,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generatedName = useId()
  const errorId = useId()
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange: (next) => next !== null && onValueChange?.(next),
  })

  return (
    <fieldset
      className={cx('op-radio-group', className)}
      data-orientation={orientation}
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      {...props}
    >
      <legend className="op-radio-group__label">
        {label}
        {required && (
          <span className="op-field__required" aria-hidden>
            *
          </span>
        )}
      </legend>
      <div className="op-radio-group__items">
        <RadioContext value={{ name: name ?? generatedName, value: current, onChange: setCurrent, disabled, required }}>
          {children}
        </RadioContext>
      </div>
      {error && (
        <p className="op-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children' | 'value' | 'checked' | 'defaultChecked' | 'name'
> & {
  value: string
  children: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function Radio({ value, children, className, style, onChange, ...props }: RadioProps) {
  const group = use(RadioContext)
  if (!group) throw new Error('[opora] <Radio> должен быть внутри <RadioGroup>')

  return (
    <label className={cx('op-radio', className)} style={style} data-disabled={props.disabled || group.disabled || undefined}>
      <input
        type="radio"
        className="op-radio__input"
        name={group.name}
        value={value}
        checked={group.value === value}
        required={group.required}
        onChange={(event) => {
          onChange?.(event)
          group.onChange(value)
        }}
        {...props}
      />
      <span className="op-radio__dot" aria-hidden />
      <span className="op-radio__label">{children}</span>
    </label>
  )
}
