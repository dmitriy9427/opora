import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../button/button'
import { Tooltip } from './tooltip'

const meta = {
  title: 'Всплывающие/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: `
Короткая подсказка при наведении или фокусе.

\`\`\`tsx
import { Button, Tooltip } from 'opora-ui'

<Tooltip content="Удалить навсегда">
  <Button iconOnly aria-label="Удалить"><TrashIcon /></Button>
</Tooltip>
\`\`\`

**Поведение:** по наведению — с задержкой (\`delay\`, 400 мс), по фокусу с клавиатуры — сразу.
Escape скрывает. На саму подсказку можно навести курсор — она не пропадёт.

**Важно**

- Ребёнок — **один** элемент, который может получить фокус: кнопка или ссылка. На обычный текст или \`<div>\` подсказку не вешают — с клавиатуры до неё не добраться.
- Подсказка не заменяет \`aria-label\` у кнопки-значка: она дополняет название, а не даёт его.
- На телефонах наведения нет, и подсказка не показывается. Не кладите в неё то, без чего нельзя обойтись.
- Внутри — только текст. Нужны кнопки или ссылки — берите \`Popover\`.
`,
      },
    },
    controls: { exclude: ['children'] },
  },
  args: {
    content: 'Сохранить изменения',
    placement: 'top',
    delay: 400,
    disabled: false,
    children: <Button>Наведите или дойдите Tab</Button>,
  },
  argTypes: {
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'] },
  },
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Placements: Story = {
  name: 'Расположение',
  render: () => (
    <div className="sb-row">
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Tooltip key={placement} content={`Подсказка: ${placement}`} placement={placement} delay={0}>
          <Button>{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
}

/** Самый частый случай: кнопка без текста. `aria-label` — название, подсказка — пояснение. */
export const IconButton: Story = {
  name: 'Кнопка-значок',
  render: () => (
    <Tooltip content="Удалить навсегда">
      <Button iconOnly aria-label="Удалить">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
        </svg>
      </Button>
    </Tooltip>
  ),
}
