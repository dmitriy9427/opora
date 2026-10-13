import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Field } from '../field/field'
import { Select, SelectOption } from './select'

const CITIES = [
  'Москва',
  'Мурманск',
  'Санкт-Петербург',
  'Казань',
  'Новосибирск',
  'Екатеринбург',
  'Нижний Новгород',
  'Самара',
  'Калининград',
  'Владивосток',
]

const meta = {
  title: 'Формы/Select',
  component: Select,
  subcomponents: { SelectOption },
  parameters: {
    docs: {
      description: {
        component: `
Выпадающий список: выбор одного значения.

\`\`\`tsx
import { Field, Select, SelectOption } from 'opora-ui'

<Field label="Город">
  <Select name="city" value={city} onValueChange={setCity} placeholder="Выберите город">
    <SelectOption value="msk">Москва</SelectOption>
    <SelectOption value="spb">Санкт-Петербург</SelectOption>
  </Select>
</Field>
\`\`\`

**Клавиатура**

| Клавиша | Список закрыт | Список открыт |
| --- | --- | --- |
| ↓ ↑ Enter Пробел | открыть | двигаться / выбрать |
| Home, End | — | первый / последний вариант |
| буквы | сразу выбрать вариант на эту букву | перейти к варианту |
| Escape | — | закрыть без выбора |
| Tab | перейти дальше | выбрать текущий и перейти дальше |

**Важно**

- Кладите селект в \`Field\` — так у него появится подпись. Без \`Field\` нужен \`aria-label\`.
- \`SelectOption\` — только прямые дети \`Select\`, текст варианта — строка.
- С \`name\` значение попадает в данные формы.
- \`onValueChange\` получает значение, а не событие.
- Не помещается снизу — список откроется вверх; длинный — прокручивается.
- Поиска по вводу и выбора нескольких значений нет.
`,
      },
    },
    controls: { exclude: ['children'] },
  },
  args: { placeholder: 'Выберите город', size: 'md', disabled: false },
  argTypes: { size: { control: 'inline-radio' }, ref: { table: { disable: true } } },
  render: (args) => (
    <div className="sb-col">
      <Field label="Город" hint="Откройте и наберите «мо»">
        <Select {...args}>
          {CITIES.map((city) => (
            <SelectOption key={city} value={city} disabled={city === 'Казань'}>
              {city}
            </SelectOption>
          ))}
        </Select>
      </Field>
    </div>
  ),
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { args: { children: null } }

export const Controlled: Story = {
  name: 'Управляемый',
  args: { children: null },
  render: function Render() {
    const [plan, setPlan] = useState<string>('pro')
    return (
      <div className="sb-col">
        <Field label="Тариф">
          <Select value={plan} onValueChange={setPlan}>
            <SelectOption value="free">Бесплатный</SelectOption>
            <SelectOption value="pro">Профессиональный</SelectOption>
            <SelectOption value="team">Командный</SelectOption>
          </Select>
        </Field>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Значение: {plan}</p>
      </div>
    )
  },
}

export const States: Story = {
  name: 'Ошибка, недоступность, размеры',
  args: { children: null },
  render: () => (
    <div className="sb-col">
      <Field label="Роль" error="Выберите роль" required>
        <Select>
          <SelectOption value="admin">Администратор</SelectOption>
          <SelectOption value="manager">Менеджер</SelectOption>
        </Select>
      </Field>
      <Field label="Регион" disabled>
        <Select defaultValue="ru">
          <SelectOption value="ru">Россия</SelectOption>
        </Select>
      </Field>
      <Select size="sm" aria-label="Сортировка" defaultValue="new">
        <SelectOption value="new">Сначала новые</SelectOption>
        <SelectOption value="cheap">Сначала дешёвые</SelectOption>
      </Select>
    </div>
  ),
}
