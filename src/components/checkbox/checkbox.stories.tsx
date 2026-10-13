import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Checkbox } from './checkbox'

const meta = {
  title: 'Формы/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: `
Флажок. Внутри — настоящий \`<input type="checkbox">\`, поэтому работает как нативный.

\`\`\`tsx
import { Checkbox } from 'opora-ui'

<Checkbox name="agree" defaultChecked>Согласен с условиями</Checkbox>

<Checkbox checked={value} onChange={(event) => setValue(event.target.checked)}>
  Рассылка
</Checkbox>
\`\`\`

- Состояние — как у обычного чекбокса: \`defaultChecked\` либо \`checked\` + \`onChange\`.
- С \`name\` (и \`value\`) попадает в данные формы.
- Нажимается вся строка вместе с подписью. Клавиша — Пробел.
- Без подписи (\`children\`) нужен \`aria-label\`.

**Checkbox или Switch?** Флажок — «отметил, потом нажал Сохранить». Переключатель — «включилось сразу».
`,
      },
    },
  },
  args: { children: 'Согласен с условиями', disabled: false, indeterminate: false },
  argTypes: { ref: { table: { disable: true } } },
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { parameters: { docs: { source: { type: 'dynamic' } } } }

export const States: Story = {
  name: 'Состояния',
  render: () => (
    <div className="sb-col" style={{ gap: '0.6rem' }}>
      <Checkbox>Не отмечен</Checkbox>
      <Checkbox defaultChecked>Отмечен</Checkbox>
      <Checkbox indeterminate>Частично</Checkbox>
      <Checkbox disabled>Недоступен</Checkbox>
      <Checkbox disabled defaultChecked>
        Недоступен и отмечен
      </Checkbox>
    </div>
  ),
}

/**
 * `indeterminate` — «выбрана часть». Это только вид: значение остаётся `checked` или нет.
 * Типичный случай — флажок «выбрать все» над списком.
 */
export const SelectAll: Story = {
  name: 'Выбрать все',
  render: function Render() {
    const labels = ['Заказы', 'Отзывы', 'Новости']
    const [items, setItems] = useState([true, false, false])
    const all = items.every(Boolean)
    const some = items.some(Boolean)
    return (
      <div className="sb-col" style={{ gap: '0.6rem' }}>
        <Checkbox checked={all} indeterminate={some && !all} onChange={(event) => setItems(items.map(() => event.target.checked))}>
          Все уведомления
        </Checkbox>
        <div className="sb-col" style={{ gap: '0.5rem', paddingLeft: '1.85rem' }}>
          {labels.map((label, i) => (
            <Checkbox
              key={label}
              checked={items[i]}
              onChange={(event) => setItems(items.map((value, j) => (j === i ? event.target.checked : value)))}
            >
              {label}
            </Checkbox>
          ))}
        </div>
      </div>
    )
  },
}
