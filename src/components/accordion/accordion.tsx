/**
 * Аккордеон: список раскрывающихся секций.
 *
 * Каждая секция — «раскрывашка» (disclosure): кнопка с aria-expanded и область,
 * которой она управляет (aria-controls). Кнопка лежит внутри заголовка: так
 * секции попадают в навигацию скринридера по заголовкам.
 *
 * type="single" — открыта одна секция (остальные закрываются);
 * type="multiple" — сколько угодно.
 *
 * Плавное раскрытие без измерения высоты в JavaScript: сетка с одной строкой,
 * высота которой анимируется от 0fr до 1fr (см. accordion.css).
 */
import { createContext, use, useId, type HTMLAttributes, type ReactNode } from 'react'

import { composeHandlers, cx, useControllableState } from '../../primitives/compose'
import { moveFocus } from '../../primitives/list'
import './accordion.styles.css'

type AccordionContextValue = { isOpen: (value: string) => boolean; toggle: (value: string) => void; headingLevel: 2 | 3 | 4 | 5 | 6 }
const AccordionContext = createContext<AccordionContextValue | null>(null)

type Common = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  /** Уровень заголовков секций — по месту аккордеона в структуре страницы. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

export type AccordionProps =
  | (Common & {
      type?: 'single'
      value?: string | null
      defaultValue?: string | null
      onValueChange?: (value: string | null) => void
      /** Можно ли закрыть открытую секцию (false — одна всегда открыта). */
      collapsible?: boolean
    })
  | (Common & {
      type: 'multiple'
      value?: string[]
      defaultValue?: string[]
      onValueChange?: (value: string[]) => void
      collapsible?: never
    })

export function Accordion(props: AccordionProps) {
  const {
    type = 'single',
    value,
    defaultValue,
    onValueChange,
    collapsible = true,
    headingLevel = 3,
    className,
    onKeyDown,
    ...rest
  } = props as Common & {
    type?: 'single' | 'multiple'
    value?: string | null | string[]
    defaultValue?: string | null | string[]
    onValueChange?: (value: never) => void
    collapsible?: boolean
  }

  // Внутри значение всегда массив — так одна логика на оба режима.
  const toArray = (input: string | null | string[] | undefined) =>
    input === undefined ? undefined : Array.isArray(input) ? input : input === null ? [] : [input]
  const [open, setOpen] = useControllableState<string[]>({
    value: toArray(value),
    defaultValue: toArray(defaultValue) ?? [],
    onChange: (next) =>
      (onValueChange as ((value: string | null | string[]) => void) | undefined)?.(type === 'multiple' ? next : (next[0] ?? null)),
  })

  const toggle = (item: string) => {
    const isOpen = open.includes(item)
    if (type === 'multiple') return setOpen(isOpen ? open.filter((v) => v !== item) : [...open, item])
    if (isOpen) return collapsible ? setOpen([]) : undefined
    setOpen([item])
  }

  return (
    <AccordionContext value={{ isOpen: (item) => open.includes(item), toggle, headingLevel }}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- обработчик ловит всплывшие нажатия с кнопок-заголовков */}
      <div
        className={cx('op-accordion', className)}
        // Стрелки вверх и вниз ходят по заголовкам секций — необязательное, но удобное дополнение.
        onKeyDown={composeHandlers(onKeyDown, (event) => {
          if ((event.target as HTMLElement).matches('.op-accordion__trigger'))
            moveFocus(event, '.op-accordion__trigger', { orientation: 'vertical' })
        })}
        {...rest}
      />
    </AccordionContext>
  )
}

export type AccordionItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  value: string
  title: ReactNode
  disabled?: boolean
}

export function AccordionItem({ value, title, disabled = false, className, children, ...props }: AccordionItemProps) {
  const accordion = use(AccordionContext)
  if (!accordion) throw new Error('[opora] <AccordionItem> должен быть внутри <Accordion>')
  const id = useId()
  const open = accordion.isOpen(value)
  const Heading = `h${accordion.headingLevel}` as const

  return (
    <div className={cx('op-accordion__item', className)} data-state={open ? 'open' : 'closed'} {...props}>
      <Heading className="op-accordion__heading">
        <button
          type="button"
          id={`${id}-trigger`}
          className="op-accordion__trigger"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={() => accordion.toggle(value)}
        >
          <span>{title}</span>
          <svg
            className="op-accordion__chevron"
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
      </Heading>
      {/* inert у закрытой секции: содержимое остаётся в DOM ради анимации, но недоступно фокусу и скринридеру. */}
      <section id={`${id}-panel`} aria-labelledby={`${id}-trigger`} className="op-accordion__panel" inert={!open}>
        <div className="op-accordion__content">
          <div className="op-accordion__body">{children}</div>
        </div>
      </section>
    </div>
  )
}
