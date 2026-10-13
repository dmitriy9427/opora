import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'

const meta = {
  title: 'Действия/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
Кнопка. Принимает все атрибуты \`<button>\`: \`onClick\`, \`disabled\`, \`type\`, \`aria-label\`…

\`\`\`tsx
import { Button } from 'opora-ui'

<Button variant="primary" onClick={save}>Сохранить</Button>
\`\`\`

**Как выбирать вариант**

| Вариант | Когда |
| --- | --- |
| \`primary\` | главное действие экрана — обычно одно |
| \`secondary\` | остальные действия (по умолчанию) |
| \`ghost\` | второстепенное: «Отмена», кнопки-значки в строках |
| \`danger\` | необратимое: удаление |

**Важно**

- \`type\` по умолчанию — \`"button"\`. Для отправки формы укажите \`type="submit"\`.
- Кнопке из одного значка (\`iconOnly\`) обязателен \`aria-label\` — иначе скринридер скажет просто «кнопка».
- \`loading\` не выключает кнопку (\`disabled\`), а оставляет её в фокусе: человек с клавиатурой не «теряет место».
`,
      },
    },
  },
  args: { children: 'Сохранить', variant: 'primary', size: 'md', loading: false, disabled: false, iconOnly: false },
  argTypes: {
    variant: { control: 'inline-radio' },
    size: { control: 'inline-radio' },
    icon: { control: false },
    asChild: { control: false },
    ref: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

const Trash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
  </svg>
)

/** Меняйте пропсы на вкладке **Controls** внизу. */
export const Playground: Story = { parameters: { docs: { source: { type: 'dynamic' } } } }

export const Variants: Story = {
  name: 'Варианты',
  render: () => (
    <div className="sb-row">
      <Button variant="primary">Основная</Button>
      <Button variant="secondary">Обычная</Button>
      <Button variant="ghost">Тихая</Button>
      <Button variant="danger">Опасная</Button>
    </div>
  ),
}

/** Высота совпадает с высотой `Input` и `Select` того же размера — в одном ряду они стоят ровно. */
export const Sizes: Story = {
  name: 'Размеры',
  render: () => (
    <div className="sb-row">
      <Button size="sm">Маленькая</Button>
      <Button size="md">Средняя</Button>
      <Button size="lg">Большая</Button>
    </div>
  ),
}

/** Пока идёт запрос: индикатор, нажатия не выполняются. Дойдите до кнопки клавишей Tab — она в обходе. */
export const Loading: Story = {
  name: 'Загрузка и недоступность',
  render: () => (
    <div className="sb-row">
      <Button variant="primary" loading>
        Сохраняем
      </Button>
      <Button disabled>Недоступна</Button>
    </div>
  ),
}

/** Значок — любой SVG; размер подстроится под текст. У кнопки без текста обязателен `aria-label`. */
export const WithIcon: Story = {
  name: 'Со значком',
  render: () => (
    <div className="sb-row">
      <Button icon={<Trash />}>Удалить</Button>
      <Button iconOnly aria-label="Удалить">
        <Trash />
      </Button>
      <Button iconOnly variant="ghost" size="sm" aria-label="Удалить">
        <Trash />
      </Button>
    </div>
  ),
}

/** `asChild` отдаёт вид кнопки ребёнку: в разметке остаётся настоящая ссылка `<a>`, без вложенного `<button>`. */
export const AsLink: Story = {
  name: 'Ссылка с видом кнопки',
  render: () => (
    <Button asChild variant="primary">
      <a href="https://github.com/dmitriy9427/opora">Открыть репозиторий</a>
    </Button>
  ),
}

/** В форме: одна кнопка отправляет, вторая — нет. */
export const InForm: Story = {
  name: 'В форме',
  render: () => (
    <form className="sb-row" onSubmit={(event) => event.preventDefault()}>
      <Button>Отмена</Button>
      <Button type="submit" variant="primary">
        Отправить
      </Button>
    </form>
  ),
}
