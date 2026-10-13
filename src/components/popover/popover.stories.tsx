import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../button/button'
import { Field, Input } from '../field/field'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover'

const meta = {
  title: 'Всплывающие/Popover',
  component: PopoverContent,
  subcomponents: { Popover, PopoverTrigger, PopoverClose },
  parameters: {
    docs: {
      description: {
        component: `
Всплывающая панель у кнопки: фильтры, быстрые настройки, подробности.

\`\`\`tsx
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from 'opora-ui'

<Popover>
  <PopoverTrigger asChild><Button>Фильтры</Button></PopoverTrigger>
  <PopoverContent aria-label="Фильтры" placement="bottom-start">
    …
    <PopoverClose asChild><Button size="sm">Применить</Button></PopoverClose>
  </PopoverContent>
</Popover>
\`\`\`

**Что выбрать**

| Нужно | Компонент |
| --- | --- |
| короткий текст-пояснение при наведении | \`Tooltip\` |
| панель с полями и кнопками, страница остаётся доступной | **\`Popover\`** |
| список действий | \`Menu\` |
| задача, которую нужно завершить или отменить | \`Dialog\` |

**Поведение:** открывается по нажатию; фокус уходит внутрь; Escape, клик мимо и повторное нажатие
на кнопку закрывают; фокус возвращается на кнопку.

**\`placement\`** — сторона и выравнивание: \`top\`, \`bottom\`, \`left\`, \`right\` и с суффиксом
\`-start\` / \`-end\` (\`bottom-end\`). Если места нет, панель перевернётся на другую сторону сама.

Дайте панели \`aria-label\` — название для скринридера.
`,
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof PopoverContent>
export default meta
type Story = StoryObj

export const Basic: Story = {
  name: 'Фильтры',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Фильтры</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Фильтры" style={{ width: '16rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Field label="Цена от">
            <Input size="sm" inputMode="numeric" placeholder="0" />
          </Field>
          <Field label="Цена до">
            <Input size="sm" inputMode="numeric" placeholder="10 000" />
          </Field>
          <PopoverClose asChild>
            <Button variant="primary" size="sm">
              Применить
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

/** Откройте каждый: панель встаёт с нужной стороны. Уменьшите окно — перевернётся. */
export const Placements: Story = {
  name: 'Расположение',
  render: () => (
    <div className="sb-row">
      {(['top', 'bottom-start', 'bottom-end', 'right'] as const).map((placement) => (
        <Popover key={placement}>
          <PopoverTrigger asChild>
            <Button>{placement}</Button>
          </PopoverTrigger>
          <PopoverContent placement={placement} aria-label={`Пример ${placement}`}>
            placement="{placement}"
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
}
