/**
 * Поле формы: подпись, элемент ввода, подсказка и ошибка — связанные между собой.
 *
 *   <Field label="Почта" hint="Пришлём чек" error={errors.email}>
 *     <Input type="email" />
 *   </Field>
 *
 * Что значит «связанные»:
 *   - <label for> ↔ id поля: клик по подписи ставит курсор, скринридер читает подпись;
 *   - aria-describedby → подсказка и ошибка: их зачитают после подписи;
 *   - aria-invalid при ошибке; текст ошибки — role="alert" (зачитывается при появлении).
 *
 * Field передаёт всё это вниз через контекст — Input не нужно знать id и писать aria руками.
 */
import {
  createContext,
  use,
  useId,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react'

import { cx } from '../../primitives/compose'
import './field.styles.css'

type FieldContextValue = {
  id: string
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  disabled: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

export type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  label: ReactNode
  hint?: ReactNode
  /** Текст ошибки. Есть ошибка — поле помечается как неверное. */
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  children: ReactNode
}

export function Field({ label, hint, error, required = false, disabled = false, className, children, ...props }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const invalid = Boolean(error)
  // Сначала ошибка: она важнее подсказки.
  const describedBy = [invalid && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx('op-field', className)} data-invalid={invalid || undefined} data-disabled={disabled || undefined} {...props}>
      <label className="op-field__label" htmlFor={id}>
        {label}
        {required && (
          // Звёздочка — для глаз; скринридеру «обязательное» сообщит атрибут required у поля.
          <span className="op-field__required" aria-hidden>
            *
          </span>
        )}
      </label>
      <FieldContext value={{ id, describedBy, invalid, required, disabled }}>{children}</FieldContext>
      {hint && (
        <p className="op-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {invalid && (
        <p className="op-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Атрибуты для элемента ввода внутри Field. Свои пропсы компонента важнее контекста:
 * id или aria-describedby можно задать вручную.
 */
export function useFieldControl<
  P extends { id?: string; disabled?: boolean; required?: boolean; 'aria-describedby'?: string; 'aria-invalid'?: unknown },
>(props: P) {
  const field = use(FieldContext)
  if (!field) return props
  return {
    ...props,
    id: props.id ?? field.id,
    disabled: props.disabled ?? (field.disabled || undefined),
    required: props.required ?? (field.required || undefined),
    'aria-describedby': [props['aria-describedby'], field.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
  }
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'sm' | 'md' | 'lg'
  ref?: Ref<HTMLInputElement>
}

export function Input({ size = 'md', className, ...props }: InputProps) {
  return <input className={cx('op-input', className)} data-size={size} {...useFieldControl(props)} />
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return <textarea className={cx('op-input', 'op-textarea', className)} rows={rows} {...useFieldControl(props)} />
}
