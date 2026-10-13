import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from '../badge/badge'
import { Spinner } from '../spinner/spinner'
import { Button } from './button'

const meta = {
  title: 'Компоненты/Button',
  component: Button,
  args: { children: 'Сохранить', variant: 'primary', size: 'md', loading: false, disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

const Trash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
  </svg>
)

/** Меняйте пропсы на вкладке Controls. */
export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <Button variant="primary">Основная</Button>
      <Button variant="secondary">Обычная</Button>
      <Button variant="ghost">Тихая</Button>
      <Button variant="danger">Опасная</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="sb-row">
      <Button size="sm">Маленькая</Button>
      <Button size="md">Средняя</Button>
      <Button size="lg">Большая</Button>
    </div>
  ),
}

/** `loading` не убирает кнопку из обхода клавишей Tab: попробуйте дойти до неё с клавиатуры. */
export const States: Story = {
  render: () => (
    <div className="sb-row">
      <Button variant="primary" loading>
        Сохраняем
      </Button>
      <Button disabled>Недоступна</Button>
      <Button icon={<Trash />}>Со значком</Button>
      <Button iconOnly aria-label="Удалить">
        <Trash />
      </Button>
    </div>
  ),
}

/** `asChild` отдаёт вид кнопки ссылке: в DOM остаётся `<a>`, без вложенного `<button>`. */
export const AsLink: Story = {
  render: () => (
    <Button asChild variant="primary">
      <a href="https://github.com/dmitriy9427/opora">Открыть репозиторий</a>
    </Button>
  ),
}

export const BadgesAndSpinner: Story = {
  name: 'Badge и Spinner',
  render: () => (
    <div className="sb-row">
      <Badge>Черновик</Badge>
      <Badge tone="accent">Новое</Badge>
      <Badge tone="success">Оплачен</Badge>
      <Badge tone="warning">Ожидает</Badge>
      <Badge tone="danger">Отменён</Badge>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  ),
}
