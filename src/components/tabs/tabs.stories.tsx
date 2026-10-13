import type { Meta, StoryObj } from '@storybook/react-vite'

import { Accordion, AccordionItem } from '../accordion/accordion'
import { Tab, TabList, TabPanel, Tabs } from './tabs'

const meta = {
  title: 'Компоненты/Tabs и Accordion',
  component: Tabs,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Tabs>
export default meta
type Story = StoryObj

/** Tab входит в список вкладок один раз; между вкладками — стрелки, Home и End. */
export const Horizontal: Story = {
  name: 'Вкладки',
  render: () => (
    <Tabs defaultValue="profile" className="sb-wide">
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
}

/** `activation="manual"`: стрелки только двигают фокус, вкладку открывает Enter или Пробел. */
export const VerticalManual: Story = {
  name: 'Вертикальные, ручная активация',
  render: () => (
    <Tabs defaultValue="a" orientation="vertical" activation="manual" className="sb-wide">
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

/** Высота раскрывается плавно без JavaScript: анимируется строка сетки от 0fr до 1fr. */
export const AccordionSingle: Story = {
  name: 'Аккордеон: одна секция',
  render: () => (
    <Accordion defaultValue="delivery" className="sb-wide">
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
    </Accordion>
  ),
}

export const AccordionMultiple: Story = {
  name: 'Аккордеон: несколько секций',
  render: () => (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="sb-wide">
      <AccordionItem value="a" title="Первая">
        Секции открываются независимо друг от друга.
      </AccordionItem>
      <AccordionItem value="b" title="Вторая">
        Эта тоже открыта.
      </AccordionItem>
      <AccordionItem value="c" title="Третья">
        А эта закрыта.
      </AccordionItem>
    </Accordion>
  ),
}
