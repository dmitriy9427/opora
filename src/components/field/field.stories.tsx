import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../button/button'
import { Checkbox } from '../checkbox/checkbox'
import { Radio, RadioGroup } from '../radio/radio'
import { Select, SelectOption } from '../select/select'
import { toast } from '../toast/toast'
import { Field, Input, Textarea } from './field'

const meta = {
  title: 'Формы/Field, Input, Textarea',
  component: Field,
  subcomponents: { Input, Textarea },
  parameters: {
    docs: {
      description: {
        component: `
\`Field\` — обёртка поля: подпись, подсказка и ошибка. Внутрь кладётся \`Input\`, \`Textarea\` или \`Select\`.

\`\`\`tsx
import { Field, Input, Textarea } from 'opora-ui'

<Field label="Почта" hint="Пришлём чек" error={errors.email} required>
  <Input type="email" name="email" />
</Field>
\`\`\`

**Что \`Field\` делает за вас**

- связывает подпись с полем — клик по подписи ставит курсор; \`id\` придумывать не нужно;
- подсказку и ошибку скринридер зачитывает вместе с полем;
- при ошибке поле помечается как неверное, а текст ошибки объявляется сразу при появлении.

**\`Input\` и \`Textarea\`** принимают все атрибуты \`<input>\` и \`<textarea>\`: \`value\`, \`defaultValue\`,
\`onChange\`, \`name\`, \`type\`, \`placeholder\`, \`maxLength\`…

Поле без \`Field\` (например, поиск в шапке) должно иметь \`aria-label\`.
`,
      },
    },
    controls: { exclude: ['children'] },
  },
  args: { label: 'Почта', hint: 'На неё придёт чек', error: '', required: false, disabled: false, children: null },
  render: (args) => (
    <div className="sb-col">
      <Field {...args}>
        <Input type="email" placeholder="name@example.com" />
      </Field>
    </div>
  ),
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

/** Впишите текст в `error` на вкладке Controls — поле станет красным, а ошибка появится под ним. */
export const Playground: Story = {}

export const States: Story = {
  name: 'Состояния',
  render: () => (
    <div className="sb-col">
      <Field label="Обычное" hint="С подсказкой">
        <Input placeholder="Текст" />
      </Field>
      <Field label="Обязательное" required>
        <Input />
      </Field>
      <Field label="С ошибкой" error="Не короче 8 символов">
        <Input type="password" defaultValue="12345" />
      </Field>
      <Field label="Недоступное" disabled>
        <Input defaultValue="OPORA" />
      </Field>
    </div>
  ),
}

export const Sizes: Story = {
  name: 'Размеры Input',
  render: () => (
    <div className="sb-col">
      <Input size="sm" aria-label="Маленькое" placeholder="sm" />
      <Input size="md" aria-label="Среднее" placeholder="md" />
      <Input size="lg" aria-label="Большое" placeholder="lg" />
    </div>
  ),
}

export const TextareaStory: Story = {
  name: 'Textarea',
  render: () => (
    <div className="sb-col">
      <Field label="Комментарий" hint="Необязательно">
        <Textarea rows={4} placeholder="Что важно знать курьеру" />
      </Field>
    </div>
  ),
}

/**
 * Все элементы — настоящие поля формы. Значения собирает обычный `FormData`,
 * без единой строки состояния React. Нажмите «Отправить».
 */
export const WholeForm: Story = {
  name: 'Форма целиком',
  render: () => (
    <form
      className="sb-col"
      onSubmit={(event) => {
        event.preventDefault()
        const data = Object.fromEntries(new FormData(event.currentTarget))
        toast.success('Форма отправлена', { description: JSON.stringify(data) })
      }}
    >
      <Field label="Имя" required>
        <Input name="name" defaultValue="Дмитрий" required />
      </Field>
      <Field label="Тариф">
        <Select name="plan" defaultValue="pro">
          <SelectOption value="free">Бесплатный</SelectOption>
          <SelectOption value="pro">Профессиональный</SelectOption>
        </Select>
      </Field>
      <RadioGroup label="Оплата" name="billing" defaultValue="year" orientation="horizontal">
        <Radio value="month">Помесячно</Radio>
        <Radio value="year">За год</Radio>
      </RadioGroup>
      <Checkbox name="news" value="yes" defaultChecked>
        Присылать новости
      </Checkbox>
      <Button type="submit" variant="primary">
        Отправить
      </Button>
    </form>
  ),
}
