import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '../button/button'
import { Field, Input } from '../field/field'
import { Select, SelectOption } from '../select/select'
import { toast } from '../toast/toast'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './dialog'

const meta = {
  title: 'Всплывающие/Dialog',
  component: DialogContent,
  subcomponents: { Dialog, DialogTrigger, DialogClose },
  parameters: {
    docs: {
      description: {
        component: `
Модальное окно: пока оно открыто, остальная страница недоступна.

\`\`\`tsx
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger } from 'opora-ui'

<Dialog>
  <DialogTrigger asChild>
    <Button variant="primary">Новый проект</Button>
  </DialogTrigger>
  <DialogContent
    title="Новый проект"
    description="Название можно изменить позже."
    footer={
      <>
        <DialogClose asChild><Button>Отмена</Button></DialogClose>
        <Button variant="primary" onClick={create}>Создать</Button>
      </>
    }
  >
    …содержимое…
  </DialogContent>
</Dialog>
\`\`\`

**Части**

| Часть | Что делает |
| --- | --- |
| \`Dialog\` | хранит состояние «открыт / закрыт»: \`open\`, \`defaultOpen\`, \`onOpenChange\` |
| \`DialogTrigger\` | кнопка, открывающая окно. С \`asChild\` — ваша кнопка |
| \`DialogContent\` | само окно; его пропсы — в таблице ниже |
| \`DialogClose\` | кнопка, закрывающая окно («Отмена», «Готово») |

**Поведение — из коробки**

- при открытии фокус уходит внутрь (на элемент с \`data-autofocus\` или на первый доступный);
- Tab ходит по кругу внутри окна;
- Escape, крестик и клик по затемнению закрывают;
- после закрытия фокус возвращается на кнопку, открывшую окно;
- страница под окном не прокручивается и недоступна скринридеру.

**Важно**

- \`title\` обязателен — это название окна для скринридера.
- Для подтверждений («Удалить?») используйте \`role="alertdialog"\`: клик мимо такое окно не закрывает.
- Открыть окно без кнопки-триггера — управляемым режимом: \`<Dialog open={open} onOpenChange={setOpen}>\`.
`,
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof DialogContent>
export default meta
type Story = StoryObj

/**
 * Откройте и нажимайте Tab — фокус не выходит из окна. Внутри селект: его Escape закрывает
 * только список, второй Escape — окно. `data-autofocus` ставит курсор сразу в поле.
 */
export const Basic: Story = {
  name: 'С формой',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Новый проект</Button>
      </DialogTrigger>
      <DialogContent
        title="Новый проект"
        description="Название и регион можно изменить позже."
        footer={
          <>
            <DialogClose asChild>
              <Button>Отмена</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast.success('Проект создан')}>
                Создать
              </Button>
            </DialogClose>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Field label="Название">
            <Input data-autofocus placeholder="Мой проект" />
          </Field>
          <Field label="Регион">
            <Select defaultValue="msk">
              <SelectOption value="msk">Москва</SelectOption>
              <SelectOption value="spb">Санкт-Петербург</SelectOption>
              <SelectOption value="nsk">Новосибирск</SelectOption>
            </Select>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  ),
}

/**
 * `role="alertdialog"` — нужен явный ответ: клик по затемнению окно не закрывает. Фокус по
 * умолчанию стоит на безопасной кнопке (`data-autofocus`), чтобы случайный Enter ничего не удалил.
 */
export const Confirm: Story = {
  name: 'Подтверждение',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Удалить проект</Button>
      </DialogTrigger>
      <DialogContent
        role="alertdialog"
        size="sm"
        hideClose
        title="Удалить проект «Опора»?"
        description="Все файлы и история будут удалены без возможности восстановления."
        footer={
          <>
            <DialogClose asChild>
              <Button data-autofocus>Не удалять</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger" onClick={() => toast('Проект удалён')}>
                Удалить
              </Button>
            </DialogClose>
          </>
        }
      />
    </Dialog>
  ),
}

/**
 * Управляемый режим: окно закрывается из кода — здесь после «отправки» формы.
 * Так же окно можно открыть без кнопки-триггера.
 */
export const Controlled: Story = {
  name: 'Управляемый: закрыть после отправки',
  render: function Render() {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Пригласить</Button>
        </DialogTrigger>
        <DialogContent title="Пригласить участника">
          <form
            style={{ display: 'grid', gap: '1rem' }}
            onSubmit={(event) => {
              event.preventDefault()
              setSaving(true)
              setTimeout(() => {
                setSaving(false)
                setOpen(false)
                toast.success('Приглашение отправлено')
              }, 900)
            }}
          >
            <Field label="Почта" required>
              <Input type="email" required data-autofocus placeholder="name@example.com" />
            </Field>
            <Button type="submit" variant="primary" loading={saving}>
              Отправить
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
}

export const Sizes: Story = {
  name: 'Размеры',
  render: () => (
    <div className="sb-row">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button>{size}</Button>
          </DialogTrigger>
          <DialogContent size={size} title={`Окно ${size}`} description="Ширина ограничена, на узком экране окно занимает всю ширину." />
        </Dialog>
      ))}
    </div>
  ),
}
