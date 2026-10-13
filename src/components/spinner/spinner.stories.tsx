import type { Meta, StoryObj } from '@storybook/react-vite'

import { Spinner } from './spinner'

const meta = {
  title: 'Действия/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component: `
Индикатор загрузки.

\`\`\`tsx
import { Spinner } from 'opora-ui'

<Spinner label="Загружаем заказы" />
\`\`\`

- \`label\` зачитывается скринридером, когда индикатор появляется (по умолчанию — «Загрузка»).
- Рядом уже написано «Загрузка…»? Передайте \`label=""\` — индикатор станет декоративным, и текст не прозвучит дважды.
- Цвет наследуется от текста (\`currentColor\`), размер — от шрифта.
- Для кнопки отдельный индикатор не нужен: у \`Button\` есть проп \`loading\`.
`,
      },
    },
  },
  args: { size: 'md', label: 'Загрузка' },
  argTypes: { size: { control: 'inline-radio' } },
} satisfies Meta<typeof Spinner>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { parameters: { docs: { source: { type: 'dynamic' } } } }

export const Sizes: Story = {
  name: 'Размеры',
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  ),
}

/** Рядом с текстом — декоративный: `label=""`. */
export const WithText: Story = {
  name: 'Рядом с текстом',
  render: () => (
    <p className="sb-row" style={{ color: 'var(--op-text-muted)' }}>
      <Spinner size="sm" label="" /> Загружаем заказы…
    </p>
  ),
}
