/**
 * Селект — выбор одного значения из списка.
 *
 * Нативный <select> нельзя оформить как остальной интерфейс, поэтому список
 * нарисован свой. Цена — всё поведение приходится повторить:
 *
 *   кнопка:  role="combobox", aria-expanded, aria-controls → список;
 *   список:  role="listbox" → role="option" с aria-selected.
 *
 * Фокус ВСЁ ВРЕМЯ остаётся на кнопке. «Текущий» пункт списка отмечается не
 * фокусом, а атрибутом aria-activedescendant на кнопке: он указывает id пункта,
 * который скринридер должен считать активным. Так устроены все комбобоксы.
 *
 * Клавиатура (WAI-ARIA, шаблон Select-Only Combobox):
 *   закрыт:  ↓ ↑ Enter Пробел — открыть; буквы — выбрать по первым буквам, не открывая;
 *   открыт:  ↓ ↑ Home End — двигать активный пункт; Enter Пробел — выбрать;
 *            Escape — закрыть без выбора; Tab — выбрать активный и уйти дальше; буквы — поиск.
 *
 * Для форм рядом лежит <input type="hidden"> с выбранным значением.
 *
 * Варианты — дочерние <SelectOption>. Селект читает их пропсы (value, текст,
 * disabled), сами они ничего не рисуют: так подпись выбранного варианта
 * известна и при закрытом списке.
 */
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'

import { composeRefs, cx, useControllableState } from '../../primitives/compose'
import { useLayer } from '../../primitives/layers'
import { nextIndex, useTypeahead } from '../../primitives/list'
import { Portal } from '../../primitives/portal'
import { usePosition } from '../../primitives/position'
import { usePresence } from '../../primitives/presence'
import { useFieldControl } from '../field/field'
import './select.styles.css'

export type SelectOptionProps = { value: string; children: string; disabled?: boolean }

/** Вариант селекта. Сам ничего не рисует — его пропсы читает <Select>. */
export function SelectOption(_props: SelectOptionProps) {
  return null
}

export type SelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange' | 'children'> & {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  placeholder?: string
  /** Имя поля формы — с ним значение уйдёт при отправке. */
  name?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Select({
  value,
  defaultValue = null,
  onValueChange,
  placeholder = 'Выберите…',
  name,
  size = 'md',
  className,
  children,
  ref,
  ...rest
}: SelectProps) {
  const { required, ...props } = useFieldControl(rest)
  const baseId = useId()
  const listId = `${baseId}-list`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const options = Children.toArray(children)
    .filter((child): child is React.ReactElement<SelectOptionProps> => isValidElement(child) && child.type === SelectOption)
    .map((child) => child.props)
  const enabled = options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0)

  const [selected, setSelected] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange: (next) => next !== null && onValueChange?.(next),
  })
  const [open, setOpen] = useState(false)
  /** Индекс активного пункта (на который указывает aria-activedescendant). */
  const [active, setActive] = useState(-1)

  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const presence = usePresence(open)
  const position = usePosition(trigger, popup, { open: presence.present, placement: 'bottom-start', offset: 4, matchWidth: true })
  const typeahead = useTypeahead()
  const selectedIndex = options.findIndex((option) => option.value === selected)

  useLayer({ open, content: popup, trigger, onDismiss: () => setOpen(false) })

  const openList = (from: 'selected' | 'first' | 'last' = 'selected') => {
    if (props.disabled) return
    setActive(
      from === 'last' ? (enabled[enabled.length - 1] ?? -1) : from === 'first' || selectedIndex < 0 ? (enabled[0] ?? -1) : selectedIndex,
    )
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    setSelected(option.value)
    setOpen(false)
  }

  // Активный пункт должен быть виден: при движении стрелками список прокручивается за ним.
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId строится из baseId и не меняется
  }, [open, active])

  /** Сдвинуть активный пункт по списку доступных (выключенные пропускаются). */
  const move = (key: string) => {
    const index = nextIndex(key, enabled.indexOf(active), enabled.length, { orientation: 'vertical', loop: false })
    if (index === null) return false
    setActive(enabled[index]!)
    return true
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event

    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault()
        return openList(key === 'ArrowUp' && selectedIndex < 0 ? 'last' : 'selected')
      }
      // Закрытый селект: буквы сразу выбирают вариант — как у нативного <select>.
      const found = typeahead(
        key,
        options.map((option) => option.children),
        selectedIndex,
      )
      if (found >= 0 && !options[found]!.disabled) setSelected(options[found]!.value)
      return
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      return choose(active)
    }
    // Tab: выбрать активный пункт и не мешать фокусу уйти дальше (preventDefault не нужен).
    if (key === 'Tab') return choose(active)
    if (move(key)) return event.preventDefault()

    const found = typeahead(
      key,
      options.map((option) => option.children),
      active,
    )
    if (found >= 0 && !options[found]!.disabled) setActive(found)
  }

  return (
    <>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-required={required || undefined}
        className={cx('op-select', className)}
        data-size={size}
        data-placeholder={selectedIndex < 0 || undefined}
        ref={composeRefs(trigger, ref)}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        {...props}
      >
        <span className="op-select__value">{selectedIndex >= 0 ? options[selectedIndex]!.children : placeholder}</span>
        <svg
          className="op-select__chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {name && <input type="hidden" name={name} value={selected ?? ''} />}

      {presence.present && (
        <Portal>
          <div
            className="op-select__popup"
            data-state={presence.state}
            data-side={position.side}
            style={position.style}
            ref={composeRefs(popup, presence.ref)}
          >
            <div
              role="listbox"
              id={listId}
              className="op-select__list"
              // Клик по списку не должен забирать фокус у кнопки: вся клавиатура живёт на ней.
              onPointerDown={(event) => event.preventDefault()}
            >
              {options.map((option, index) => (
                // Пункты не нужно делать фокусируемыми: «фокус» изображает aria-activedescendant.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- клавиатура обрабатывается на кнопке
                <div
                  key={option.value}
                  role="option"
                  id={optionId(index)}
                  aria-selected={option.value === selected}
                  aria-disabled={option.disabled || undefined}
                  className="op-select__option"
                  data-active={index === active || undefined}
                  onClick={() => choose(index)}
                  onPointerMove={() => !option.disabled && setActive(index)}
                >
                  <span className="op-select__option-text">{option.children}</span>
                  {option.value === selected && (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
