/**
 * Опора — публичный интерфейс пакета.
 *
 * Всё, что экспортировано отсюда, — обещание пользователям: убрать или
 * переименовать это можно только в мажорной версии. Поэтому наружу отдаётся
 * не всё подряд, а продуманный список; внутренние помощники остаются внутренними.
 */
import './styles/tokens.css'

export { Accordion, AccordionItem, type AccordionItemProps, type AccordionProps } from './components/accordion/accordion'
export { Badge, type BadgeProps } from './components/badge/badge'
export { Button, type ButtonProps } from './components/button/button'
export { Checkbox, type CheckboxProps } from './components/checkbox/checkbox'
export { Dialog, DialogClose, DialogContent, DialogTrigger, type DialogContentProps, type DialogProps } from './components/dialog/dialog'
export { Field, Input, Textarea, type FieldProps, type InputProps, type TextareaProps } from './components/field/field'
export {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  type MenuCheckboxItemProps,
  type MenuContentProps,
  type MenuItemProps,
  type MenuProps,
} from './components/menu/menu'
export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
} from './components/popover/popover'
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './components/radio/radio'
export { Select, SelectOption, type SelectOptionProps, type SelectProps } from './components/select/select'
export { Spinner, type SpinnerProps } from './components/spinner/spinner'
export { Switch, type SwitchProps } from './components/switch/switch'
export { Tab, TabList, TabPanel, Tabs, type TabPanelProps, type TabProps, type TabsProps } from './components/tabs/tabs'
export { Toaster, toast, type ToastOptions, type ToastType, type ToasterProps } from './components/toast/toast'
export { Tooltip, type TooltipProps } from './components/tooltip/tooltip'

// Кирпичи, из которых собраны компоненты, — чтобы строить свои.
export { Portal } from './primitives/portal'
export { Slot } from './primitives/slot'
export { VisuallyHidden } from './primitives/visually-hidden'
export { useControllableState } from './primitives/compose'
export { computePosition, type Placement } from './primitives/position'
