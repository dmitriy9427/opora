import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '../button/button'
import { toast } from '../toast/toast'
import { Tooltip } from '../tooltip/tooltip'
import { Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger } from './menu'

const meta = {
  title: 'Всплывающие/Menu',
  component: MenuItem,
  subcomponents: { Menu, MenuTrigger, MenuContent, MenuCheckboxItem, MenuGroup, MenuSeparator },
  parameters: {
    docs: {
      description: {
        component: `
Меню действий у кнопки: «Переименовать», «Дублировать», «Удалить».

\`\`\`tsx
import { Button, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from 'opora-ui'

<Menu>
  <MenuTrigger asChild><Button>Действия</Button></MenuTrigger>
  <MenuContent>
    <MenuItem onSelect={rename}>Переименовать</MenuItem>
    <MenuItem disabled>Переместить</MenuItem>
    <MenuSeparator />
    <MenuItem danger onSelect={remove}>Удалить</MenuItem>
  </MenuContent>
</Menu>
\`\`\`

**Части**

| Часть | Что делает |
| --- | --- |
| \`Menu\` | состояние: \`open\`, \`defaultOpen\`, \`onOpenChange\` |
| \`MenuTrigger\` | кнопка меню (с \`asChild\` — ваша) |
| \`MenuContent\` | список; \`placement\` — где открыть |
| \`MenuItem\` | действие; пропсы — в таблице ниже |
| \`MenuCheckboxItem\` | пункт-флажок: \`checked\`, \`onCheckedChange\`; меню не закрывает |
| \`MenuGroup\` | группа с подписью \`label\` |
| \`MenuSeparator\` | разделитель |

**Клавиатура**

| Где | Клавиши |
| --- | --- |
| на кнопке | Enter, Пробел, ↓ — открыть; ↑ — открыть с последнего пункта |
| в меню | ↑ ↓ — по пунктам; Home, End; буквы — к пункту на эту букву |
| | Enter, Пробел — выбрать; Escape — закрыть; Tab — закрыть и идти дальше |

**Важно**

- Действие — в \`onSelect\`, а не в \`onClick\`: он срабатывает и от клика, и от клавиатуры.
- Чтобы меню не закрылось после выбора: \`onSelect={(event) => event.preventDefault()}\`.
- \`shortcut\` — только подпись («⌘K»); само сочетание клавиш меню не обрабатывает.
- Это меню **действий**. Навигацию по сайту делайте ссылками в \`<nav>\`.
- Подменю нет.
`,
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof MenuItem>
export default meta
type Story = StoryObj

/** Нажмите на кнопке ↓ (или ↑) и пройдите меню с клавиатуры. Наберите «у» — фокус прыгнет на «Удалить». */
export const Basic: Story = {
  name: 'Действия',
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button>Действия</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem shortcut="F2" onSelect={() => toast('Переименование')}>
          Переименовать
        </MenuItem>
        <MenuItem onSelect={() => toast('Копия создана')}>Дублировать</MenuItem>
        <MenuItem disabled>Переместить</MenuItem>
        <MenuSeparator />
        <MenuItem danger shortcut="⌫" onSelect={() => toast.error('Удалено')}>
          Удалить
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
}

/** Пункты-флажки: меню остаётся открытым, пока отмечают несколько. */
export const Checkboxes: Story = {
  name: 'Группы и флажки',
  render: function Render() {
    const [grid, setGrid] = useState(true)
    const [rulers, setRulers] = useState(false)
    return (
      <Menu>
        <MenuTrigger asChild>
          <Button>Вид</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuGroup label="Показывать">
            <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Сетку
            </MenuCheckboxItem>
            <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers}>
              Линейки
            </MenuCheckboxItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem
            onSelect={() => {
              setGrid(false)
              setRulers(false)
            }}
          >
            Скрыть всё
          </MenuItem>
        </MenuContent>
      </Menu>
    )
  },
}

/** Кнопка-значок: `aria-label` обязателен. Подсказку можно обернуть вокруг `MenuTrigger`. */
export const IconTrigger: Story = {
  name: 'Кнопка-значок с подсказкой',
  render: () => (
    <Menu>
      <Tooltip content="Действия">
        <MenuTrigger asChild>
          <Button iconOnly variant="ghost" aria-label="Действия">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <circle cx="3" cy="8" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="13" cy="8" r="1.4" />
            </svg>
          </Button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent placement="bottom-end">
        <MenuItem>Открыть</MenuItem>
        <MenuItem>Поделиться</MenuItem>
      </MenuContent>
    </Menu>
  ),
}
