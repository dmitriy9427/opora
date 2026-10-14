# 04. API компонентов

API библиотеки — её интерфейс для разработчика. Хороший API предсказуем: увидел один
компонент — угадал, как устроены остальные. Ниже — шесть договорённостей «Опоры».

## 1. Компонент расширяет нативный элемент

```tsx
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cx('op-button', className)} data-variant={variant} {...props} />
}
```

- Все атрибуты `<button>` работают: `onClick`, `disabled`, `aria-label`, `form`, `data-testid`…
  Библиотека не решает за пользователя, что ему понадобится.
- `className` **добавляется** к библиотечному, а не заменяет его.
- `...props` — последним: пользователь может переопределить почти всё.
- `ref` — обычный проп (React 19). `forwardRef` больше не нужен.

## 2. Управляемый и неуправляемый режим

Как у `<input>`: либо `defaultValue` (компонент хранит состояние сам), либо `value` +
`onChange` (состоянием владеет родитель).

```tsx
<Tabs defaultValue="profile" />                       // неуправляемый: поставил и забыл
<Tabs value={tab} onValueChange={setTab} />           // управляемый: нужно знать или менять снаружи
```

Оба режима — одним хуком (`primitives/compose.ts`):

```ts
const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onValueChange })
```

Передан `value` — используется он, а `setCurrent` только сообщает наружу. Не передан —
значение живёт во внутреннем `useState`.

Имена единообразны: `value` / `defaultValue` / `onValueChange` для значения,
`open` / `defaultOpen` / `onOpenChange` для открытости. `onValueChange` получает **значение**,
а не событие — в отличие от нативного `onChange`.

## 3. Составные компоненты

```tsx
<Tabs defaultValue="a">
  <TabList aria-label="Настройки">
    <Tab value="a">Профиль</Tab>
    <Tab value="b">Доступ</Tab>
  </TabList>
  <TabPanel value="a">…</TabPanel>
  <TabPanel value="b">…</TabPanel>
</Tabs>
```

Вместо одного компонента с пропсом `items={[{ label, content, disabled, icon… }]}`.

| | Один компонент + конфиг | Составные |
| --- | --- | --- |
| Разметка между частями | нельзя | можно: обёртка, счётчик рядом с вкладкой |
| Свой проп у одной части | нужен новый ключ в конфиге | просто проп: `<Tab disabled>` |
| Типы | один большой объект | у каждой части свои |
| Объём кода у пользователя | меньше | больше |

Части общаются через **контекст**: `Tabs` кладёт туда текущее значение и функцию выбора,
`Tab` и `TabPanel` читают.

```tsx
const TabsContext = createContext<TabsContextValue | null>(null)

const useTabs = (name: string) => {
  const context = use(TabsContext)
  if (!context) throw new Error(`[opora] <${name}> должен быть внутри <Tabs>`)
  return context
}
```

Понятная ошибка вместо «Cannot read properties of null» — часть API.

Связи между частями (`aria-controls`, `aria-labelledby`) строятся из общего `useId()`:
`${baseId}-tab-${value}` ↔ `${baseId}-panel-${value}`. Пользователь id не придумывает.

**Когда не составной.** `Select` принимает детей-`SelectOption`, но рисует всё сам, а
`AccordionItem` получает заголовок пропсом `title`. Там, где структура всегда одна, лишняя
свобода — лишний способ собрать неправильно.

## 4. `asChild` — отдать поведение чужому элементу

```tsx
<Button asChild variant="primary">
  <a href="/docs">Документация</a>
</Button>
```

В DOM — одна ссылка с классами кнопки. Без `asChild` пришлось бы либо вкладывать
`<a>` в `<button>` (нельзя: интерактивное в интерактивном), либо делать проп `as="a"` и
терять типы.

То же у триггеров:

```tsx
<DialogTrigger asChild>
  <Button variant="primary">Открыть</Button>
</DialogTrigger>
```

`DialogTrigger` не рисует свою кнопку, а добавляет нашей `aria-haspopup`, `aria-expanded`,
обработчик и ref.

Реализация — `Slot` (`primitives/slot.tsx`), 40 строк:

```tsx
return cloneElement(child, { ...mergeProps(props, child.props), ref: composeRefs(ref, child.props.ref) })
```

`mergeProps` склеивает: обработчики вызываются **оба** (сначала ребёнка, потом слота),
`className` объединяются, `style` сливаются, остальное — проп ребёнка важнее.

## 5. Обработчики: пользовательский первым и с правом отмены

```ts
onClick={composeHandlers(onClick, () => dialog.setOpen(true))}
```

```ts
function composeHandlers(theirs, ours) {
  return (event) => {
    theirs?.(event)
    if (!event.defaultPrevented) ours(event)
  }
}
```

Пользователь может вмешаться в поведение компонента стандартным способом:

```tsx
<DialogTrigger onClick={(event) => { if (!saved) event.preventDefault() }}>   // не открывать
<MenuItem onSelect={(event) => event.preventDefault()}>                       // не закрывать меню
```

Отдельные пропсы «preventOpen», «keepOpenOnSelect» не нужны.

## 6. Несколько ref на одном элементе

Компоненту нужен свой ref (измерить, сфокусировать), и пользователь передаёт свой:

```tsx
ref={composeRefs(content, presence.ref, ref)}
```

`composeRefs` раздаёт узел всем — и объектам, и функциям — и возвращает общую очистку
(в React 19 ref-функция может вернуть функцию очистки).

Пример, где без этого никак: `Tooltip` вокруг `MenuTrigger`. Оба хотят ref одной и той же
кнопки — подсказка, чтобы встать рядом, меню, чтобы вернуть фокус. Сначала ref подсказки
затирал ref меню ([lessons.md](lessons.md), №9).

## Публичное и внутреннее

`src/index.ts` экспортирует компоненты, их типы пропсов и пять «кирпичей». Остальное
(`useLayer`, `useFocusTrap`, `usePresence`…) — внутреннее: его можно менять в любой версии.

Всё экспортированное — обещание. Убрать или переименовать можно только в мажорной версии.
Поэтому наружу отдаётся меньше, чем хочется: добавить экспорт потом легко, забрать — нельзя.

## Что считается ломающим изменением

| Изменение | Версия |
| --- | --- |
| Исправили баг, поведение стало «как в документации» | patch |
| Новый компонент, новый необязательный проп | minor |
| Переименовали или удалили проп, компонент, CSS-переменную | **major** |
| Поменяли значение по умолчанию | **major** |
| Поменяли разметку или имя класса `op-…` | **major** — на них пишут стили и тесты |
| Подняли требуемую версию React | **major** |

Имена классов и `data-`атрибуты — тоже API, хотя их нет в TypeScript.

## Ошибки

> **Свои пропсы вместо нативных.** `<Button text="Сохранить" handleClick={…}>` — человеку
> придётся учить ваш язык. Компонент расширяет `<button>`: `children`, `onClick`, `type`,
> `disabled` работают как всегда (`...props`).
>
> **Переключаться между управляемым и неуправляемым режимом** (`value` то есть, то
> `undefined`). Режим определяется по наличию `value` — меняя его на ходу, вы ломаете
> компонент.
>
> **Свой обработчик затирает пользовательский** (`onClick={ourHandler}` после `{...props}`).
> Склейте: сначала пользовательский, потом ваш — и уважайте `preventDefault()`
> (`composeHandlers`).
>
> **`<button><a href></a></button>`** — интерактивный внутри интерактивного: недопустимо и ломает
> скринридер. Для ссылки с видом кнопки — `asChild`.
>
> **Один `ref` на элемент**, когда он нужен и вам, и пользователю. Склейте (`composeRefs`).

## Попробуйте сами

1. Сделайте ссылку с видом основной кнопки на `/docs`. Почему не `<Button onClick={() => location.href = '/docs'}>`?
2. Откройте вкладки в управляемом режиме, но забудьте `onValueChange`. Что будет при клике?
3. Пользователь передал `<DialogTrigger onClick={(e) => e.preventDefault()}>`. Откроется ли
   диалог?

<details>
<summary>Ответы</summary>

1. `<Button asChild variant="primary"><a href="/docs">Документация</a></Button>`. У ссылки
   работают «открыть в новой вкладке», копирование адреса, скринридер называет её ссылкой.
2. Ничего: значением владеет родитель, а он его не меняет. (Как `<input value>` без `onChange`.)
3. Нет: `composeHandlers` вызывает пользовательский обработчик первым и пропускает свой, если
   `event.defaultPrevented`.
</details>
