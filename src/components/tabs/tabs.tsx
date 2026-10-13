/**
 * Вкладки.
 *
 * Роли: tablist → tab → tabpanel. Клавиатура по правилам WAI-ARIA:
 *   - Tab входит в список вкладок ОДИН раз — на выбранную вкладку — и следующим
 *     нажатием уходит в панель. Невыбранные вкладки имеют tabindex="-1"
 *     (это называется «блуждающий tabindex», roving tabindex);
 *   - стрелки ← → ходят между вкладками, Home и End — на первую и последнюю.
 *
 * Два режима активации:
 *   automatic (по умолчанию) — вкладка открывается, как только на неё пришёл фокус;
 *   manual — стрелки только двигают фокус, открывает Enter или Пробел. Нужен,
 *   когда содержимое вкладки тяжёлое (загрузка данных).
 */
import { createContext, use, useId, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'

import { composeHandlers, cx, useControllableState } from '../../primitives/compose'
import { moveFocus, type Orientation } from '../../primitives/list'
import './tabs.styles.css'

type TabsContextValue = {
  baseId: string
  value: string
  select: (value: string) => void
  orientation: Orientation
  activation: 'automatic' | 'manual'
}
const TabsContext = createContext<TabsContextValue | null>(null)

const useTabs = (name: string) => {
  const context = use(TabsContext)
  if (!context) throw new Error(`[opora] <${name}> должен быть внутри <Tabs>`)
  return context
}

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  /** Выбранная вкладка (управляемый режим). */
  value?: string
  /** Вкладка, выбранная при первом показе. Задайте её: иначе не выбрана ни одна. */
  defaultValue?: string
  /** Вызывается со значением новой вкладки. */
  onValueChange?: (value: string) => void
  /** Вкладки в строку или столбцом; от этого зависят клавиши-стрелки. */
  orientation?: Orientation
  /** automatic — вкладка открывается при фокусе; manual — только по Enter или Пробелу. */
  activation?: 'automatic' | 'manual'
}

export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  activation = 'automatic',
  className,
  ...props
}: TabsProps) {
  const baseId = useId()
  const [current, select] = useControllableState({ value, defaultValue, onChange: onValueChange })
  return (
    <TabsContext value={{ baseId, value: current, select, orientation, activation }}>
      <div className={cx('op-tabs', className)} data-orientation={orientation} {...props} />
    </TabsContext>
  )
}

export function TabList({ className, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { orientation, activation, select } = useTabs('TabList')
  return (
    // Фокус получают сами вкладки (role="tab"), а не их список — так требует шаблон WAI-ARIA.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cx('op-tabs__list', className)}
      onKeyDown={composeHandlers(onKeyDown, (event) => {
        const focused = moveFocus(event, '[role="tab"]', { orientation })
        if (focused && activation === 'automatic') select(focused.dataset.value!)
      })}
      {...props}
    />
  )
}

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> & {
  /** Значение вкладки — то же, что у её TabPanel. */
  value: string
  children: ReactNode
}

export function Tab({ value, className, onClick, disabled, ...props }: TabProps) {
  const tabs = useTabs('Tab')
  const selected = tabs.value === value
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${tabs.baseId}-panel-${value}`}
      // В обходе Tab участвует только выбранная вкладка.
      tabIndex={selected ? 0 : -1}
      data-value={value}
      data-state={selected ? 'active' : 'inactive'}
      disabled={disabled}
      className={cx('op-tabs__tab', className)}
      onClick={composeHandlers(onClick, () => tabs.select(value))}
      {...props}
    />
  )
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** Значение вкладки, которой принадлежит панель. */
  value: string
  /** Оставлять содержимое неактивной панели в DOM (сохраняет состояние, прокрутку, введённый текст). */
  keepMounted?: boolean
}

export function TabPanel({ value, keepMounted = false, className, children, ...props }: TabPanelProps) {
  const tabs = useTabs('TabPanel')
  const selected = tabs.value === value
  if (!selected && !keepMounted) return null
  return (
    <div
      role="tabpanel"
      id={`${tabs.baseId}-panel-${value}`}
      aria-labelledby={`${tabs.baseId}-tab-${value}`}
      hidden={!selected}
      // Панель сама в фокусе: иначе, если внутри нет интерактивных элементов, Tab проскочил бы мимо текста.
      tabIndex={0}
      className={cx('op-tabs__panel', className)}
      {...props}
    >
      {children}
    </div>
  )
}
