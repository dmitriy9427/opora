import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Switch } from './switch'

const meta = {
  title: 'Формы/Switch',
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: `
Переключатель: настройка, которая применяется сразу.

\`\`\`tsx
import { Switch } from 'opora-ui'

<Switch checked={on} onChange={(event) => setOn(event.target.checked)}>Уведомления</Switch>
\`\`\`

Те же пропсы, что у \`Checkbox\`: \`checked\` / \`defaultChecked\` / \`onChange\` / \`name\` / \`disabled\`.
Скринридер объявляет его как «переключатель, включён», а не «флажок, отмечен». Клавиша — Пробел.
`,
      },
    },
  },
  args: { children: 'Уведомления', disabled: false },
  argTypes: { ref: { table: { disable: true } } },
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { parameters: { docs: { source: { type: 'dynamic' } } } }

export const States: Story = {
  name: 'Состояния',
  render: () => (
    <div className="sb-col" style={{ gap: '0.75rem' }}>
      <Switch>Выключен</Switch>
      <Switch defaultChecked>Включён</Switch>
      <Switch disabled>Недоступен</Switch>
    </div>
  ),
}

/** Управляемый режим: значением владеет ваш компонент. */
export const Controlled: Story = {
  name: 'Управляемый',
  render: function Render() {
    const [on, setOn] = useState(true)
    return (
      <Switch checked={on} onChange={(event) => setOn(event.target.checked)}>
        Тёмная тема: {on ? 'включена' : 'выключена'}
      </Switch>
    )
  },
}
