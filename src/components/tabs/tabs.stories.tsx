import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Badge } from '../badge/badge'
import { Tab, TabList, TabPanel, Tabs } from './tabs'

const meta = {
  title: 'Структура/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
  parameters: {
    docs: {
      description: {
        component: `
Вкладки: несколько панелей на одном месте, видна одна.

\`\`\`tsx
import { Tab, TabList, TabPanel, Tabs } from 'opora-ui'

<Tabs defaultValue="profile">
  <TabList aria-label="Настройки">
    <Tab value="profile">Профиль</Tab>
    <Tab value="access">Доступ</Tab>
  </TabList>
  <TabPanel value="profile">…</TabPanel>
  <TabPanel value="access">…</TabPanel>
</Tabs>
\`\`\`

\`Tab\` и \`TabPanel\` связаны одинаковым \`value\`.

**Клавиатура:** Tab — на выбранную вкладку, затем в панель; ← → (или ↑ ↓ у вертикальных) —
между вкладками; Home и End — первая и последняя.

**Важно**

- Задайте \`defaultValue\` (или \`value\`): иначе не выбрана ни одна вкладка.
- У \`TabList\` должен быть \`aria-label\` — название набора вкладок.
- \`activation="manual"\` — стрелки только двигают фокус, открывает Enter. Берите, когда панель грузит данные.
- \`keepMounted\` у \`TabPanel\` — не удалять скрытую панель (сохраняет введённый в ней текст).
- Вкладки — не навигация по сайту: для страниц с разными адресами нужны ссылки.
`,
      },
    },
    controls: { exclude: ['children'] },
  },
  args: { defaultValue: 'profile', orientation: 'horizontal', activation: 'automatic' },
  argTypes: { orientation: { control: 'inline-radio' }, activation: { control: 'inline-radio' } },
  render: (args) => (
    <Tabs {...args} className="sb-wide">
      <TabList aria-label="Настройки">
        <Tab value="profile">Профиль</Tab>
        <Tab value="access">Доступ</Tab>
        <Tab value="archive" disabled>
          Архив
        </Tab>
        <Tab value="billing">Оплата</Tab>
      </TabList>
      <TabPanel value="profile">Имя, почта и фотография.</TabPanel>
      <TabPanel value="access">Пароль и двухфакторная защита.</TabPanel>
      <TabPanel value="billing">Тариф и способ оплаты.</TabPanel>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>
export default meta
type Story = StoryObj<typeof meta>

/** Отложите мышь: Tab, затем стрелки, Home, End. Выключенная вкладка пропускается. */
export const Playground: Story = {}

/** Стрелки вверх и вниз; открывает Enter или Пробел. */
export const VerticalManual: Story = {
  name: 'Вертикальные, ручная активация',
  args: { defaultValue: 'a', orientation: 'vertical', activation: 'manual' },
  render: (args) => (
    <Tabs {...args} className="sb-wide">
      <TabList aria-label="Разделы справки">
        <Tab value="a">Начало работы</Tab>
        <Tab value="b">Оплата</Tab>
        <Tab value="c">Безопасность</Tab>
      </TabList>
      <TabPanel value="a">Создайте проект и пригласите команду.</TabPanel>
      <TabPanel value="b">Счёт выставляется первого числа.</TabPanel>
      <TabPanel value="c">Включите вход по ключу.</TabPanel>
    </Tabs>
  ),
}

/** Управляемый режим: выбранную вкладку хранит ваш компонент — например, чтобы записать её в адрес страницы. */
export const Controlled: Story = {
  name: 'Управляемые, со счётчиком',
  render: function Render() {
    const [tab, setTab] = useState('new')
    return (
      <Tabs value={tab} onValueChange={setTab} className="sb-wide">
        <TabList aria-label="Заказы">
          <Tab value="new">
            Новые <Badge tone="accent">3</Badge>
          </Tab>
          <Tab value="done">Выполненные</Tab>
        </TabList>
        <TabPanel value="new">Три новых заказа.</TabPanel>
        <TabPanel value="done">Здесь выполненные заказы.</TabPanel>
      </Tabs>
    )
  },
}
