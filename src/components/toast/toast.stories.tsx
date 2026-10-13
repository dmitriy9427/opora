import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../button/button'
import { Toaster, toast } from './toast'

const meta = {
  title: 'Всплывающие/toast',
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component: `
Короткие всплывающие сообщения. \`toast\` — функция, её вызывают откуда угодно: из обработчика,
после запроса, вне компонентов.

\`\`\`tsx
import { Toaster, toast } from 'opora-ui'

// один раз, в корне приложения
<Toaster />

// где угодно
toast('Черновик сохранён')
toast.success('Оплата прошла', { description: 'Чек отправлен на почту' })
toast.warning('Заканчивается место')
toast.error('Не удалось сохранить', { action: { label: 'Повторить', onClick: save } })
\`\`\`

**Опции** — второй аргумент

| Опция | Тип | По умолчанию | |
| --- | --- | --- | --- |
| \`type\` | \`'info' \\| 'success' \\| 'warning' \\| 'error'\` | \`'info'\` | у \`toast.success()\` и других задан сам |
| \`description\` | текст | — | вторая строка |
| \`duration\` | мс или \`Infinity\` | 5000 (8000 с действием) | \`Infinity\` — пока не закроют |
| \`action\` | \`{ label, onClick }\` | — | кнопка в сообщении |
| \`id\` | строка | — | повторный вызов с тем же id обновит сообщение |

**Управление**

\`\`\`ts
const id = toast('Загружаем…', { duration: Infinity })
toast.success('Готово', { id })   // обновить то же сообщение
toast.dismiss(id)                 // закрыть одно
toast.dismiss()                   // закрыть все
\`\`\`

**Поведение**

- исчезают сами; таймер **останавливается**, пока на сообщении курсор или фокус;
- на экране не больше четырёх — старые уходят;
- ошибки скринридер зачитывает сразу, остальное — когда договорит.

**Когда не использовать:** для того, что нельзя пропустить. Сообщение исчезнет — критичное
показывайте в \`Dialog\` или прямо на странице.

Пропсы \`Toaster\` (положение на экране) — в таблице ниже.
`,
      },
    },
  },
  args: { position: 'bottom-right' },
  argTypes: { position: { control: 'inline-radio' } },
  // Toaster уже стоит в оболочке Storybook — в примерах только кнопки.
  render: () => <Button onClick={() => toast('Черновик сохранён')}>Показать</Button>,
} satisfies Meta<typeof Toaster>
export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = { name: 'Простое сообщение' }

/** Наведите курсор на сообщение — оно не исчезнет, пока вы его читаете. */
export const Types: Story = {
  name: 'Виды',
  render: () => (
    <div className="sb-row">
      <Button onClick={() => toast('Черновик сохранён')}>Обычное</Button>
      <Button onClick={() => toast.success('Оплата прошла', { description: 'Чек отправлен на почту' })}>Успех</Button>
      <Button onClick={() => toast.warning('Заканчивается место', { description: 'Осталось 200 МБ' })}>Предупреждение</Button>
      <Button onClick={() => toast.error('Не удалось сохранить', { description: 'Проверьте соединение' })}>Ошибка</Button>
    </div>
  ),
}

/** Обратимое действие вместо вопроса «Вы уверены?»: удалили — и дали вернуть. */
export const WithAction: Story = {
  name: 'С действием',
  render: () => (
    <Button onClick={() => toast('Письмо удалено', { action: { label: 'Вернуть', onClick: () => toast.success('Письмо возвращено') } })}>
      Удалить письмо
    </Button>
  ),
}

/** Один и тот же `id`: сообщение о ходе работы превращается в сообщение о результате. */
export const Update: Story = {
  name: 'Обновление по id',
  render: () => (
    <Button
      onClick={() => {
        toast('Загружаем файл…', { id: 'upload', duration: Infinity })
        setTimeout(() => toast.success('Файл загружен', { id: 'upload' }), 1800)
      }}
    >
      Загрузить файл
    </Button>
  ),
}

export const Dismiss: Story = {
  name: 'Закрыть из кода',
  render: () => (
    <div className="sb-row">
      <Button onClick={() => toast('Не исчезну сам', { duration: Infinity })}>Показать постоянное</Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>
        Закрыть все
      </Button>
    </div>
  ),
}
