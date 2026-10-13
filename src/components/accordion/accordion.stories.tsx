import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Accordion, AccordionItem } from './accordion'

const meta = {
  title: 'Структура/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem },
  parameters: {
    docs: {
      description: {
        component: `
Раскрывающиеся секции: вопросы и ответы, фильтры, длинные настройки.

\`\`\`tsx
import { Accordion, AccordionItem } from 'opora-ui'

<Accordion defaultValue="delivery">
  <AccordionItem value="delivery" title="Как работает доставка?">
    Курьером на следующий день.
  </AccordionItem>
  <AccordionItem value="payment" title="Какие способы оплаты?">
    Картой или при получении.
  </AccordionItem>
</Accordion>
\`\`\`

| Проп \`Accordion\` | Значения | По умолчанию | |
| --- | --- | --- | --- |
| \`type\` | \`'single'\`, \`'multiple'\` | \`'single'\` | одна открытая секция или несколько |
| \`value\` / \`defaultValue\` | строка (или \`null\`) для \`single\`, массив строк для \`multiple\` | — | какие секции открыты |
| \`onValueChange\` | функция | — | получает новое значение |
| \`collapsible\` | \`boolean\` (только \`single\`) | \`true\` | можно ли закрыть открытую секцию |
| \`headingLevel\` | 2…6 | 3 | уровень заголовков секций — по структуре вашей страницы |

**Клавиатура:** Tab — по заголовкам; Enter или Пробел — открыть и закрыть; ↑ ↓ Home End — между заголовками.

Содержимое закрытой секции недоступно ни с клавиатуры, ни скринридеру — пока её не откроют.
`,
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Accordion>
export default meta
type Story = StoryObj

const items = (
  <>
    <AccordionItem value="delivery" title="Как работает доставка?">
      Курьером на следующий день или в пункт выдачи. Бесплатно от 3 000 ₽.
    </AccordionItem>
    <AccordionItem value="payment" title="Какие способы оплаты?">
      Картой, через СБП или при получении.
    </AccordionItem>
    <AccordionItem value="return" title="Можно ли вернуть товар?">
      В течение 14 дней, если сохранена упаковка.
    </AccordionItem>
    <AccordionItem value="b2b" title="Оптовые заказы" disabled>
      Скоро.
    </AccordionItem>
  </>
)

/** Открытие одной секции закрывает другую. */
export const Single: Story = {
  name: 'Одна секция',
  render: () => (
    <Accordion defaultValue="delivery" className="sb-wide">
      {items}
    </Accordion>
  ),
}

/** `type="multiple"`: значение — массив. */
export const Multiple: Story = {
  name: 'Несколько секций',
  render: () => (
    <Accordion type="multiple" defaultValue={['delivery', 'payment']} className="sb-wide">
      {items}
    </Accordion>
  ),
}

/** `collapsible={false}`: одна секция всегда открыта — повторное нажатие её не закроет. */
export const NotCollapsible: Story = {
  name: 'Всегда одна открыта',
  render: () => (
    <Accordion defaultValue="delivery" collapsible={false} className="sb-wide">
      {items}
    </Accordion>
  ),
}

export const Controlled: Story = {
  name: 'Управляемый',
  render: function Render() {
    const [open, setOpen] = useState<string | null>('payment')
    return (
      <div className="sb-wide" style={{ display: 'grid', gap: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Открыта: {open ?? 'ни одной'}</p>
        <Accordion value={open} onValueChange={setOpen}>
          {items}
        </Accordion>
      </div>
    )
  },
}
