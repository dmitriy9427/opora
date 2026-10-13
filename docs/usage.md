# Руководство: как пользоваться «Опорой»

Для тех, кто хочет поставить библиотеку в свой проект. Как она устроена внутри — в
[учебнике](README.md).

**Содержание**

1. [Установка](#1-установка)
2. [Подключение стилей: целиком или по частям](#2-подключение-стилей)
3. [Можно ли взять только нужные компоненты?](#3-можно-ли-взять-только-нужные-компоненты)
4. [Vite, Next.js, Astro](#4-vite-nextjs-astro)
5. [Общие правила API](#5-общие-правила-api)
6. [Компоненты](#6-компоненты): [Button](#button) · [Badge](#badge) · [Spinner](#spinner) · [Field, Input, Textarea](#field-input-textarea) · [Checkbox](#checkbox) · [Switch](#switch) · [RadioGroup](#radiogroup) · [Select](#select) · [Tabs](#tabs) · [Accordion](#accordion) · [Dialog](#dialog) · [Popover](#popover) · [Menu](#menu) · [Tooltip](#tooltip) · [toast](#toast)
7. [Темы и свои стили](#7-темы-и-свои-стили)
8. [Рецепты](#8-рецепты)
9. [Вопросы и ответы](#9-вопросы-и-ответы)

---

## 1. Установка

```bash
npm install opora-ui
```

Нужен **React 19** (`react` и `react-dom`) — библиотека берёт его из вашего проекта и сама
не устанавливает. Других зависимостей нет.

> Если пакета ещё нет в npm (`npm view opora-ui` отвечает 404), его можно собрать из
> репозитория и поставить архивом:
>
> ```bash
> git clone https://github.com/dmitriy9427/opora.git && cd opora
> npm install && npm run build && npm pack        # появится opora-ui-0.1.0.tgz
> cd ../my-app && npm install ../opora/opora-ui-0.1.0.tgz
> ```

Минимальный пример:

```tsx
// main.tsx — один раз на всё приложение
import 'opora-ui/styles.css'
```

```tsx
import { Button, Toaster, toast } from 'opora-ui'

export function App() {
  return (
    <>
      <Button variant="primary" onClick={() => toast.success('Работает')}>
        Проверить
      </Button>
      <Toaster />
    </>
  )
}
```

`<Toaster />` нужен, только если вы пользуетесь `toast()`; ставится один раз, в корне.

---

## 2. Подключение стилей

### Целиком — обычный вариант

```ts
import 'opora-ui/styles.css'
```

Один файл: все компоненты, токены, светлая и тёмная тема. **7,6 КБ** в сжатом виде (gzip).
Это меньше одной небольшой картинки — в большинстве проектов думать дальше незачем.

### По частям

Если важен каждый килобайт или нужна пара компонентов:

```ts
import 'opora-ui/css/base.css'      // обязательно и ПЕРВЫМ: слои, токены, темы
import 'opora-ui/css/button.css'
import 'opora-ui/css/dialog.css'
```

| Файл | gzip | Для каких компонентов |
| --- | --- | --- |
| `css/base.css` | 3,0 КБ | **обязателен**; токены, темы, анимации |
| `css/button.css` | 1,2 КБ | `Button` (уже включает стили `Spinner`) |
| `css/badge.css` | 0,3 КБ | `Badge` |
| `css/spinner.css` | 0,4 КБ | `Spinner` |
| `css/field.css` | 0,8 КБ | `Field`, `Input`, `Textarea` |
| `css/checkbox.css` | 0,8 КБ | `Checkbox` |
| `css/switch.css` | 0,5 КБ | `Switch` |
| `css/radio.css` | 1,1 КБ | `RadioGroup`, `Radio` (включает стили ошибки из `field`) |
| `css/select.css` | 0,8 КБ | `Select` |
| `css/tabs.css` | 0,8 КБ | `Tabs` |
| `css/accordion.css` | 0,9 КБ | `Accordion` |
| `css/dialog.css` | 1,0 КБ | `Dialog` |
| `css/popover.css` | 0,2 КБ | `Popover` |
| `css/menu.css` | 0,6 КБ | `Menu` |
| `css/tooltip.css` | 0,4 КБ | `Tooltip` |
| `css/toast.css` | 0,9 КБ | `toast`, `Toaster` |

Каждый файл самодостаточен: если компонент пользуется другим, нужные стили уже внутри.
Компоненты, используемые **внутри ваших** (например, `Button` в подвале диалога), подключайте
сами.

Пример «кнопка и диалог»: `base` 3,0 + `button` 1,2 + `dialog` 1,0 = **5,2 КБ** вместо 7,6.
Выигрыш есть, но небольшой: почти половина полного файла — это `base`.

---

## 3. Можно ли взять только нужные компоненты?

**Да, и для JavaScript это происходит само.** Пишите обычный импорт:

```ts
import { Button } from 'opora-ui'
```

Сборщик вашего приложения (Vite, Next, Webpack, Rollup) выбросит всё, что вы не
импортировали. Это называется tree-shaking. Отдельные пути вроде `opora-ui/button` не нужны.

Измерено настоящей сборкой (код библиотеки после минификации, gzip, без React):

| Что импортировано | В сборке |
| --- | --- |
| только `Button` | **0,8 КБ** |
| `Button`, `Field`, `Input`, `Checkbox` | **1,4 КБ** |
| только `Dialog` | **2,7 КБ** |
| вся библиотека (`import * as ui`) | **9,4 КБ** |

Эти числа проверяются при каждой сборке библиотеки (`scripts/treeshake.mjs`): если
tree-shaking сломается, проверка упадёт.

Почему это работает: пакет состоит из ES-модулей, каждый компонент лежит в своём файле, а в
`package.json` указано, что модули не имеют побочных действий (`"sideEffects"`).

Что может помешать **в вашем проекте**:

- `import * as ui from 'opora-ui'` и использование через `ui.Button` — некоторые сборщики
  тогда оставляют всё;
- сборка в режиме разработки (`npm run dev`) — там tree-shaking обычно выключен, смотрите
  размер продакшен-сборки;
- очень старые сборщики без поддержки ES-модулей.

Итого: **JavaScript — автоматически, CSS — по желанию** (раздел 2).

---

## 4. Vite, Next.js, Astro

### Vite

Ничего настраивать не нужно.

```tsx
// src/main.tsx
import 'opora-ui/styles.css'
import './index.css' // ваши стили — после, чтобы порядок был предсказуемым
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import 'opora-ui/styles.css'
import { Toaster } from 'opora-ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

Компоненты можно импортировать прямо в серверных компонентах: в каждом файле библиотеки уже
стоит `'use client'`. Но **обработчики** (`onClick`, `onValueChange`) передаются только из
клиентских компонентов — это правило Next, а не библиотеки:

```tsx
'use client'
import { Button, toast } from 'opora-ui'

export function SaveButton() {
  return <Button onClick={() => toast.success('Сохранено')}>Сохранить</Button>
}
```

Серверный рендеринг поддерживается: диалоги, меню и тосты рисуются в портале и появляются
после загрузки страницы в браузере, остальное — сразу в HTML.

### Astro

```astro
---
import 'opora-ui/styles.css'
import { Settings } from '../components/Settings.tsx'
---
<Settings client:load />
```

Интерактивным компонентам нужна директива `client:*` — без неё Astro отдаст только HTML.

### Tailwind 4

Чтобы утилиты Tailwind побеждали стили библиотеки, объявите порядок слоёв до импортов:

```css
@layer opora.tokens, opora.base, opora.components, theme, base, components, utilities;
@import 'opora-ui/styles.css';
@import 'tailwindcss';
```

---

## 5. Общие правила API

Усвоив их на одном компоненте, вы знаете остальные.

**Все нативные атрибуты работают.** `Button` принимает всё, что принимает `<button>`:
`onClick`, `disabled`, `type`, `aria-label`, `data-*`, `form`. `Input` — всё от `<input>`.

**`className` добавляется**, а не заменяет библиотечный класс. `style` и `ref` — тоже работают.

**Состояние: либо вы, либо компонент.**

```tsx
<Tabs defaultValue="a" />                         // компонент хранит сам
<Tabs value={tab} onValueChange={setTab} />       // храните вы
```

| Что | Неуправляемо | Управляемо |
| --- | --- | --- |
| значение | `defaultValue` | `value` + `onValueChange` |
| открыто / закрыто | `defaultOpen` | `open` + `onOpenChange` |

`onValueChange` получает **значение**, а не событие.

**`asChild` — отдать вид и поведение своему элементу.**

```tsx
<Button asChild variant="primary"><a href="/docs">Документация</a></Button>
<DialogTrigger asChild><Button>Открыть</Button></DialogTrigger>
```

У ребёнка должен быть ровно один элемент, и он обязан принимать `ref` и пропсы.

**Отменить поведение** — `event.preventDefault()` в своём обработчике:

```tsx
<MenuItem onSelect={(event) => event.preventDefault()}>Не закрывать меню</MenuItem>
```

---

## 6. Компоненты

### Button

```tsx
<Button>Обычная</Button>
<Button variant="primary">Основная</Button>
<Button variant="danger" size="sm">Удалить</Button>
<Button loading>Сохраняем</Button>
<Button icon={<PlusIcon />}>Добавить</Button>
<Button iconOnly aria-label="Закрыть"><XIcon /></Button>
<Button type="submit" variant="primary">Отправить</Button>
<Button asChild><a href="/pricing">Тарифы</a></Button>
```

| Проп | Тип | По умолчанию | |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'secondary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `loading` | `boolean` | `false` | индикатор; нажатия не выполняются, кнопка остаётся в фокусе |
| `icon` | `ReactNode` | — | значок перед текстом |
| `iconOnly` | `boolean` | `false` | квадратная; **нужен `aria-label`** |
| `asChild` | `boolean` | `false` | отдать вид ребёнку |
| `type` | как у `<button>` | **`'button'`** | не отправляет форму случайно |

Значки — любые SVG; размер подстроится (`1.15em`).

### Badge

```tsx
<Badge>Черновик</Badge>
<Badge tone="success">Оплачен</Badge>
```

`tone`: `'neutral'` (по умолчанию) `| 'accent' | 'success' | 'warning' | 'danger'`.

### Spinner

```tsx
<Spinner />
<Spinner size="lg" label="Загружаем заказы" />
<Spinner label="" />   {/* декоративный: рядом уже написано «Загрузка» */}
```

`size`: `'sm' | 'md' | 'lg'`. `label` — текст для скринридера (по умолчанию «Загрузка»).

### Field, Input, Textarea

`Field` связывает подпись, подсказку и ошибку с полем внутри — id и `aria-*` он расставит сам.

```tsx
<Field label="Почта" hint="Пришлём чек" required>
  <Input type="email" name="email" placeholder="name@example.com" />
</Field>

<Field label="Пароль" error={errors.password}>
  <Input type="password" />
</Field>

<Field label="Комментарий">
  <Textarea rows={4} />
</Field>
```

| `Field` | Тип | |
| --- | --- | --- |
| `label` | `ReactNode` | **обязателен** |
| `hint` | `ReactNode` | подсказка под полем |
| `error` | `ReactNode` | текст ошибки; поле помечается как неверное |
| `required` | `boolean` | звёздочка и атрибут `required` у поля |
| `disabled` | `boolean` | выключает поле внутри |

`Input`: всё от `<input>` + `size`: `'sm' | 'md' | 'lg'`. `Textarea`: всё от `<textarea>`.

Внутрь `Field` можно положить `Input`, `Textarea` или `Select`. Без `Field` у поля должен
быть `aria-label`.

### Checkbox

```tsx
<Checkbox name="agree" defaultChecked>Согласен с условиями</Checkbox>
<Checkbox checked={value} onChange={(event) => setValue(event.target.checked)}>Рассылка</Checkbox>
<Checkbox checked={all} indeterminate={some && !all} onChange={toggleAll} aria-label="Выбрать все" />
```

Это настоящий `<input type="checkbox">`: `checked` / `defaultChecked` / `onChange` / `name` /
`value` работают как у нативного. Дополнительно: `indeterminate` — вид «выбрано частично».

### Switch

```tsx
<Switch defaultChecked>Уведомления</Switch>
<Switch checked={on} onChange={(event) => setOn(event.target.checked)}>Тёмная тема</Switch>
```

Те же пропсы, что у `Checkbox`. Когда что брать: чекбокс — «отметить, потом нажать
Сохранить»; переключатель — «включается сразу».

### RadioGroup

```tsx
<RadioGroup label="Доставка" name="delivery" defaultValue="courier" required>
  <Radio value="courier">Курьер</Radio>
  <Radio value="pickup">Самовывоз</Radio>
  <Radio value="post" disabled>Почта</Radio>
</RadioGroup>
```

| `RadioGroup` | Тип | По умолчанию |
| --- | --- | --- |
| `label` | `ReactNode` | **обязателен** |
| `value` / `defaultValue` / `onValueChange` | `string` | — |
| `name` | `string` | генерируется |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |
| `required`, `disabled` | `boolean` | `false` |
| `error` | `ReactNode` | — |

Клавиатура: Tab — в группу, стрелки — между вариантами.

### Select

```tsx
<Field label="Город">
  <Select name="city" placeholder="Выберите город" value={city} onValueChange={setCity}>
    <SelectOption value="msk">Москва</SelectOption>
    <SelectOption value="spb">Санкт-Петербург</SelectOption>
    <SelectOption value="kzn" disabled>Казань</SelectOption>
  </Select>
</Field>
```

| `Select` | Тип | По умолчанию |
| --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | `string` | — |
| `placeholder` | `string` | `'Выберите…'` |
| `name` | `string` | — (с ним значение уходит в форму) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `disabled`, `required` | `boolean` | `false` |

Ограничения: `SelectOption` — **прямые дети** `Select`, текст варианта — строка. Поиска по
вводу и множественного выбора нет.

Клавиатура: ↓ ↑ Enter Пробел открывают; стрелки, Home, End, буквы — по списку; Enter
выбирает; Escape закрывает; на закрытом селекте буквы выбирают сразу.

### Tabs

```tsx
<Tabs defaultValue="profile">
  <TabList aria-label="Настройки">
    <Tab value="profile">Профиль</Tab>
    <Tab value="access">Доступ</Tab>
    <Tab value="billing" disabled>Оплата</Tab>
  </TabList>
  <TabPanel value="profile">…</TabPanel>
  <TabPanel value="access" keepMounted>…</TabPanel>
</Tabs>
```

| `Tabs` | Тип | По умолчанию |
| --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | `string` | — (**задайте `defaultValue`**: иначе ни одна вкладка не выбрана) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `activation` | `'automatic' \| 'manual'` | `'automatic'` |

`TabList` — дайте `aria-label`. `TabPanel keepMounted` — не удалять скрытую панель из DOM
(сохраняет введённое).

### Accordion

```tsx
<Accordion defaultValue="delivery">
  <AccordionItem value="delivery" title="Доставка">Курьером на следующий день.</AccordionItem>
  <AccordionItem value="payment" title="Оплата">Картой или при получении.</AccordionItem>
</Accordion>

<Accordion type="multiple" defaultValue={['a', 'b']}>…</Accordion>
```

| `Accordion` | Тип | По умолчанию |
| --- | --- | --- |
| `type` | `'single' \| 'multiple'` | `'single'` |
| `value` / `defaultValue` / `onValueChange` | `string \| null` или `string[]` | — |
| `collapsible` | `boolean` (только `single`) | `true` — открытую секцию можно закрыть |
| `headingLevel` | `2…6` | `3` — уровень заголовков по структуре вашей страницы |

`AccordionItem`: `value`, `title`, `disabled`.

### Dialog

```tsx
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
    <Field label="Название"><Input data-autofocus /></Field>
  </DialogContent>
</Dialog>
```

| `Dialog` | |
| --- | --- |
| `open` / `defaultOpen` / `onOpenChange` | управление открытостью |

| `DialogContent` | Тип | По умолчанию | |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | **обязателен** — название окна для скринридера |
| `description` | `ReactNode` | — | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` | `alertdialog` — подтверждение |
| `closeOnOutside` | `boolean` | `true` (`false` для `alertdialog`) | клик по затемнению |
| `hideClose` | `boolean` | `false` | убрать крестик |
| `footer` | `ReactNode` | — | кнопки внизу |

- `DialogTrigger` и `DialogClose` — с `asChild` или без (тогда рисуют свой `<button>`).
- `data-autofocus` на элементе внутри — куда встанет фокус при открытии.
- Закрывается: Escape, крестик, `DialogClose`, клик по затемнению, `onOpenChange(false)`.

Открыть без кнопки-триггера:

```tsx
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent title="Готово" />
</Dialog>
```

### Popover

```tsx
<Popover>
  <PopoverTrigger asChild><Button>Фильтры</Button></PopoverTrigger>
  <PopoverContent aria-label="Фильтры" placement="bottom-end">
    <Field label="Цена до"><Input size="sm" /></Field>
    <PopoverClose asChild><Button size="sm">Применить</Button></PopoverClose>
  </PopoverContent>
</Popover>
```

`PopoverContent`: `placement` (см. ниже, по умолчанию `'bottom-start'`), `offset` (px).
Дайте `aria-label` или `aria-labelledby`.

`placement`: `'top' | 'bottom' | 'left' | 'right'`, с выравниванием — `'bottom-start'`,
`'bottom-end'`, `'top-start'`… Если с нужной стороны нет места, элемент перевернётся сам.

### Menu

```tsx
<Menu>
  <MenuTrigger asChild><Button>Действия</Button></MenuTrigger>
  <MenuContent placement="bottom-end">
    <MenuItem icon={<EditIcon />} shortcut="F2" onSelect={rename}>Переименовать</MenuItem>
    <MenuItem disabled>Переместить</MenuItem>
    <MenuSeparator />
    <MenuGroup label="Вид">
      <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>Сетка</MenuCheckboxItem>
    </MenuGroup>
    <MenuSeparator />
    <MenuItem danger onSelect={remove}>Удалить</MenuItem>
  </MenuContent>
</Menu>
```

| `MenuItem` | Тип | |
| --- | --- | --- |
| `onSelect` | `(event: Event) => void` | клик, Enter или Пробел; `event.preventDefault()` оставит меню открытым |
| `disabled` | `boolean` | |
| `danger` | `boolean` | красный |
| `icon` | `ReactNode` | |
| `shortcut` | `string` | подпись справа; само сочетание меню не обрабатывает |

`MenuCheckboxItem`: `checked`, `onCheckedChange`, `disabled` — меню после выбора не закрывается.
`Menu`: `open` / `defaultOpen` / `onOpenChange`. Подменю нет.

Это меню **действий**. Для навигации по сайту используйте `<nav>` со ссылками.

### Tooltip

```tsx
<Tooltip content="Удалить навсегда">
  <Button iconOnly aria-label="Удалить"><TrashIcon /></Button>
</Tooltip>
```

| Проп | Тип | По умолчанию |
| --- | --- | --- |
| `content` | `ReactNode` | — |
| `placement` | как у Popover | `'top'` |
| `delay` | `number`, мс | `400` (по фокусу — сразу) |
| `disabled` | `boolean` | `false` |

Ребёнок — один элемент, умеющий получать фокус (кнопка, ссылка). Подсказка **не заменяет**
`aria-label` у кнопки-значка и не показывается на телефонах — важное в неё не кладите.

### toast

```tsx
toast('Черновик сохранён')
toast.success('Оплата прошла', { description: 'Чек отправлен на почту' })
toast.warning('Заканчивается место')
toast.error('Не удалось сохранить', { action: { label: 'Повторить', onClick: save } })

const id = toast('Загружаем…', { duration: Infinity })
toast.success('Готово', { id })       // обновить тот же тост
toast.dismiss(id)                     // закрыть один
toast.dismiss()                       // закрыть все
```

| Опция | Тип | По умолчанию |
| --- | --- | --- |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` |
| `description` | `ReactNode` | — |
| `duration` | `number` мс или `Infinity` | 5000 (8000 с `action`) |
| `action` | `{ label, onClick }` | — |
| `id` | `string` | генерируется |

`<Toaster position="bottom-right" />` — `'top-right' | 'top-center' | 'bottom-right' |
'bottom-center'`. На экране не больше четырёх тостов. Таймер останавливается под курсором.

---

## 7. Темы и свои стили

Цвета, скругления и шрифт — CSS-переменные:

```css
:root {
  --op-accent: #0a8f5b;
  --op-accent-hover: #087a4d;
  --op-radius: 4px;
  --op-font: 'Inter', sans-serif;
}
```

Тёмная тема следует за системой. Принудительно:

```html
<html data-theme="dark">   <!-- или "light" -->
```

Переключатель темы:

```ts
document.documentElement.dataset.theme = dark ? 'dark' : 'light'
```

Свой стиль компонента — обычным классом, без `!important`:

```css
.cta { border-radius: 999px; padding-inline: 2rem }
```

```tsx
<Button className="cta" variant="primary">Начать</Button>
```

Состояния доступны через атрибуты: `.op-button[data-variant='primary']`,
`.op-tabs__tab[aria-selected='true']`, `.op-dialog[data-state='closed']`.

Полный список переменных и объяснение, почему это работает, — [03-styles.md](03-styles.md).

---

## 8. Рецепты

### Форма без состояния (FormData)

Все поля — настоящие элементы формы:

```tsx
<form onSubmit={(event) => {
  event.preventDefault()
  const data = Object.fromEntries(new FormData(event.currentTarget))
  // { name: 'Дмитрий', plan: 'pro', news: 'yes' }
}}>
  <Field label="Имя" required><Input name="name" /></Field>
  <Field label="Тариф"><Select name="plan" defaultValue="pro">…</Select></Field>
  <Checkbox name="news" value="yes">Новости</Checkbox>
  <Button type="submit" variant="primary">Отправить</Button>
</form>
```

### react-hook-form

```tsx
const { register, control, handleSubmit, formState: { errors } } = useForm<Values>()

<Field label="Почта" error={errors.email?.message}>
  <Input {...register('email', { required: 'Укажите почту' })} />
</Field>

<Checkbox {...register('agree')}>Согласен</Checkbox>

{/* Select — не нативный элемент: через Controller */}
<Controller control={control} name="city" render={({ field, fieldState }) => (
  <Field label="Город" error={fieldState.error?.message}>
    <Select value={field.value} onValueChange={field.onChange} onBlur={field.onBlur}>…</Select>
  </Field>
)} />
```

### Подтверждение удаления

```tsx
<Dialog>
  <DialogTrigger asChild><Button variant="danger">Удалить</Button></DialogTrigger>
  <DialogContent
    role="alertdialog" size="sm" hideClose
    title="Удалить проект?"
    description="Файлы и история будут удалены без восстановления."
    footer={
      <>
        <DialogClose asChild><Button data-autofocus>Не удалять</Button></DialogClose>
        <DialogClose asChild><Button variant="danger" onClick={remove}>Удалить</Button></DialogClose>
      </>
    }
  />
</Dialog>
```

Фокус — на безопасной кнопке; клик мимо окно не закрывает.

### Действие с отменой вместо вопроса

```tsx
const remove = (item) => {
  setItems((list) => list.filter((x) => x.id !== item.id))
  toast(`«${item.name}» удалён`, { action: { label: 'Вернуть', onClick: () => setItems((list) => [...list, item]) } })
}
```

### Запрос с индикатором

```tsx
const save = async () => {
  const id = toast('Сохраняем…', { duration: Infinity })
  try {
    await api.save(values)
    toast.success('Сохранено', { id })
  } catch (error) {
    toast.error('Не удалось сохранить', { id, action: { label: 'Повторить', onClick: save } })
  }
}

<Button variant="primary" loading={saving} onClick={save}>Сохранить</Button>
```

### Закрыть диалог после успешной отправки

```tsx
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Пригласить</Button></DialogTrigger>
  <DialogContent title="Пригласить участника">
    <form onSubmit={async (event) => {
      event.preventDefault()
      await invite(new FormData(event.currentTarget))
      setOpen(false)
    }}>…</form>
  </DialogContent>
</Dialog>
```

### Подсказка на кнопке меню

```tsx
<Menu>
  <Tooltip content="Действия">
    <MenuTrigger asChild>
      <Button iconOnly variant="ghost" aria-label="Действия"><DotsIcon /></Button>
    </MenuTrigger>
  </Tooltip>
  <MenuContent>…</MenuContent>
</Menu>
```

### Ссылка-пункт меню

```tsx
<MenuItem onSelect={() => navigate('/settings')}>Настройки</MenuItem>
```

### Свой компонент на кирпичах библиотеки

```tsx
import { Portal, VisuallyHidden, useControllableState, computePosition } from 'opora-ui'

<button><StarIcon /><VisuallyHidden>В избранное</VisuallyHidden></button>
```

---

## 9. Вопросы и ответы

**Работает ли с React 18?**
Нет. Библиотека использует возможности React 19 (`ref` как проп, `use`, `<Context value>`).

**Есть ли CommonJS (`require`)?**
Нет, только ES-модули. Node 22+ умеет `require()` для ESM; сборщики работают с ESM давно.

**TypeScript?**
Типы в пакете, отдельный `@types` не нужен. Типы пропсов экспортируются: `ButtonProps`,
`DialogContentProps`…

**Тесты моего приложения падают с «ResizeObserver is not defined».**
В jsdom нет нескольких браузерных API, которыми пользуются всплывающие компоненты. В файл
настройки тестов:

```ts
Element.prototype.scrollIntoView ??= () => {}
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
```

**Как искать компоненты в тестах?**
По ролям: `getByRole('button', { name: 'Сохранить' })`, `getByRole('dialog', { name: 'Новый
проект' })`, `getByRole('combobox', { name: 'Город' })`, `getByRole('tab')`, `getByRole('menuitem')`.

**Диалог и меню рисуются не там, где написаны.**
Они в портале — в конце `<body>`. Стили по «родительскому» селектору (`.my-page .op-dialog`)
не сработают; задавайте `className` самому компоненту.

**Всплывающее окно оказалось не у кнопки.**
Проверьте, нет ли у предков CSS-свойства `zoom` — с ним координаты считаются иначе.
Масштаб браузера (Cmd +) на позиционирование не влияет.

**Можно ли менять разметку компонентов?**
Нет: части фиксированы, настраиваются пропсами и стилями. Нужна другая структура — соберите
свой компонент; исходники открыты и подробно прокомментированы.

**Чего в библиотеке нет?**
Таблицы, календаря, комбобокса с поиском, множественного выбора, слайдера, подменю,
загрузки файлов. Это учебная библиотека из 16 базовых компонентов.

**Где посмотреть вживую?**
https://dmitriy9427.github.io/opora/ — у каждого компонента примеры, вкладка Controls и
проверка доступности.
