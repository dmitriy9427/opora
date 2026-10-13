import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '../button/button'
import { Checkbox } from '../checkbox/checkbox'
import { Radio, RadioGroup } from '../radio/radio'
import { Select, SelectOption } from '../select/select'
import { Switch } from '../switch/switch'
import { toast } from '../toast/toast'
import { Field, Input, Textarea } from './field'

const meta = {
  title: 'Компоненты/Формы',
  component: Field,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj

/** Подпись, подсказка и ошибка связаны с полем: кликните по подписи или включите скринридер. */
export const Fields: Story = {
  name: 'Field, Input, Textarea',
  render: () => (
    <div className="sb-col">
      <Field label="Почта" hint="На неё придёт чек" required>
        <Input type="email" placeholder="name@example.com" />
      </Field>
      <Field label="Пароль" error="Не короче 8 символов">
        <Input type="password" defaultValue="12345" />
      </Field>
      <Field label="Комментарий">
        <Textarea placeholder="Необязательно" />
      </Field>
      <Field label="Промокод" disabled>
        <Input defaultValue="OPORA" />
      </Field>
    </div>
  ),
}

export const Checkboxes: Story = {
  name: 'Checkbox и Switch',
  render: function Render() {
    const [items, setItems] = useState([true, false, false])
    const all = items.every(Boolean)
    const some = items.some(Boolean)
    return (
      <div className="sb-col">
        {/* «Частично выбран»: родительский флажок отражает состояние дочерних. */}
        <Checkbox checked={all} indeterminate={some && !all} onChange={(event) => setItems(items.map(() => event.target.checked))}>
          Все уведомления
        </Checkbox>
        <div className="sb-col" style={{ gap: '0.5rem', paddingLeft: '1.85rem' }}>
          {['Заказы', 'Отзывы', 'Новости'].map((label, i) => (
            <Checkbox
              key={label}
              checked={items[i]}
              onChange={(event) => setItems(items.map((value, j) => (j === i ? event.target.checked : value)))}
            >
              {label}
            </Checkbox>
          ))}
        </div>
        <Switch defaultChecked>Тёмная тема по расписанию</Switch>
        <Switch disabled>Недоступная настройка</Switch>
      </div>
    )
  },
}

/** Внутри группы вариант переключают стрелки, Tab проходит группу за одно нажатие. */
export const Radios: Story = {
  name: 'RadioGroup',
  render: () => (
    <div className="sb-col">
      <RadioGroup label="Доставка" defaultValue="courier" required>
        <Radio value="courier">Курьер — завтра</Radio>
        <Radio value="pickup">Самовывоз — сегодня</Radio>
        <Radio value="post" disabled>
          Почта — недоступно
        </Radio>
      </RadioGroup>
      <RadioGroup label="Размер" orientation="horizontal" error="Выберите размер">
        <Radio value="s">S</Radio>
        <Radio value="m">M</Radio>
        <Radio value="l">L</Radio>
      </RadioGroup>
    </div>
  ),
}

/** Откройте список и попробуйте клавиатуру: стрелки, Home/End, буквы, Enter, Escape. */
export const Selects: Story = {
  name: 'Select',
  render: () => (
    <div className="sb-col">
      <Field label="Город" hint="Попробуйте набрать «мо» при открытом списке">
        <Select placeholder="Выберите город">
          {[
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
          ].map((city) => (
            <SelectOption key={city} value={city} disabled={city === 'Казань'}>
              {city}
            </SelectOption>
          ))}
        </Select>
      </Field>
      <Field label="Роль" error="Выберите роль">
        <Select>
          <SelectOption value="admin">Администратор</SelectOption>
          <SelectOption value="manager">Менеджер</SelectOption>
        </Select>
      </Field>
    </div>
  ),
}

/** Все элементы — настоящие поля формы: значения собирает обычный FormData, без состояния React. */
export const NativeForm: Story = {
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
        <Input name="name" defaultValue="Дмитрий" />
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
