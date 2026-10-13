import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Radio, RadioGroup } from './radio'

const meta = {
  title: 'Формы/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  parameters: {
    docs: {
      description: {
        component: `
Выбор одного варианта из нескольких, когда все варианты должны быть видны сразу.

\`\`\`tsx
import { Radio, RadioGroup } from 'opora-ui'

<RadioGroup label="Доставка" name="delivery" defaultValue="courier">
  <Radio value="courier">Курьер</Radio>
  <Radio value="pickup">Самовывоз</Radio>
</RadioGroup>
\`\`\`

**Клавиатура:** Tab — войти в группу (на выбранный вариант), стрелки — переключать, Tab — выйти.

**RadioGroup или Select?** До пяти коротких вариантов — радиогруппа: всё видно без клика.
Больше или мало места — \`Select\`.

\`label\` обязателен: это подпись всей группы («Доставка»), её зачитывает скринридер.
`,
      },
    },
    controls: { exclude: ['children'] },
  },
  args: { label: 'Доставка', orientation: 'vertical', required: false, disabled: false, error: '', defaultValue: 'courier' },
  argTypes: { orientation: { control: 'inline-radio' } },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="courier">Курьер — завтра</Radio>
      <Radio value="pickup">Самовывоз — сегодня</Radio>
      <Radio value="post">Почта — 3–5 дней</Radio>
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Horizontal: Story = {
  name: 'В строку',
  render: () => (
    <RadioGroup label="Размер" orientation="horizontal" defaultValue="m">
      <Radio value="s">S</Radio>
      <Radio value="m">M</Radio>
      <Radio value="l">L</Radio>
    </RadioGroup>
  ),
}

/** Выключить можно один вариант или всю группу (`disabled` у `RadioGroup`). Стрелки выключенный вариант пропускают. */
export const DisabledAndError: Story = {
  name: 'Недоступный вариант и ошибка',
  render: () => (
    <div className="sb-col">
      <RadioGroup label="Доставка" defaultValue="courier">
        <Radio value="courier">Курьер</Radio>
        <Radio value="post" disabled>
          Почта — недоступно в вашем городе
        </Radio>
      </RadioGroup>
      <RadioGroup label="Оплата" required error="Выберите способ оплаты">
        <Radio value="card">Картой</Radio>
        <Radio value="cash">При получении</Radio>
      </RadioGroup>
    </div>
  ),
}

export const Controlled: Story = {
  name: 'Управляемый',
  render: function Render() {
    const [value, setValue] = useState<string>('month')
    return (
      <div className="sb-col">
        <RadioGroup label="Оплата" value={value} onValueChange={setValue} orientation="horizontal">
          <Radio value="month">Помесячно</Radio>
          <Radio value="year">За год</Radio>
        </RadioGroup>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Выбрано: {value === 'month' ? '990 ₽ в месяц' : '9 900 ₽ в год'}</p>
      </div>
    )
  },
}
