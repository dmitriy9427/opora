import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'

const meta = {
  title: 'Действия/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: `
Метка-статус: «Оплачен», «Черновик», «3 новых».

\`\`\`tsx
import { Badge } from 'opora-ui'

<Badge tone="success">Оплачен</Badge>
\`\`\`

Цвет — подсказка, а не единственный носитель смысла: статус должен быть понятен из текста.
`,
      },
    },
  },
  args: { children: 'Оплачен', tone: 'success' },
  argTypes: { tone: { control: 'inline-radio' } },
} satisfies Meta<typeof Badge>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { parameters: { docs: { source: { type: 'dynamic' } } } }

export const Tones: Story = {
  name: 'Цвета',
  render: () => (
    <div className="sb-row">
      <Badge>Черновик</Badge>
      <Badge tone="accent">Новое</Badge>
      <Badge tone="success">Оплачен</Badge>
      <Badge tone="warning">Ожидает</Badge>
      <Badge tone="danger">Отменён</Badge>
    </div>
  ),
}
