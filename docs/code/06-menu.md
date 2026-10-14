# 6. Меню

[src/components/menu/menu.tsx](../../src/components/menu/menu.tsx), [src/primitives/list.ts](../../src/primitives/list.ts)

## Где это

Кнопка «⋯» у строки таблицы: «Переименовать», «Дублировать», «Удалить». Меню **действий**, как в
приложениях. (Навигация сайта — это `<nav>` со ссылками, а не `role="menu"`.)

## Что делает

- Кнопка: Enter, Пробел, ↓ — открыть и встать на первый пункт; ↑ — на последний.
- В меню: ↑ ↓ по кругу, Home/End, буквы — поиск по первым буквам, Enter/Пробел — выбрать,
  Escape — закрыть, Tab — закрыть и идти дальше по странице.
- После закрытия фокус возвращается на кнопку.
- Наведение мыши = фокус: подсветка одна.
- Пункты-флажки (`MenuCheckboxItem`) не закрывают меню; выключенные пункты стрелки пропускают.

## Пример

```tsx
<Menu>
  <MenuTrigger asChild><Button iconOnly aria-label="Действия" icon={<DotsIcon />} /></MenuTrigger>
  <MenuContent>
    <MenuItem onSelect={rename} shortcut="F2">Переименовать</MenuItem>
    <MenuItem onSelect={duplicate}>Дублировать</MenuItem>
    <MenuSeparator />
    <MenuItem danger onSelect={(event) => { if (!confirm('Удалить?')) event.preventDefault() }}>Удалить</MenuItem>
  </MenuContent>
</Menu>
```

`event.preventDefault()` в `onSelect` оставляет меню открытым.

## Роли

```html
<button aria-haspopup="menu" aria-expanded="true" aria-controls="r1-menu" id="r1-trigger">…</button>
<div role="menu" id="r1-menu" aria-labelledby="r1-trigger" aria-orientation="vertical">
  <div role="menuitem" tabindex="-1">Переименовать</div>
  <div role="separator"></div>
  <div role="menuitemcheckbox" aria-checked="true" tabindex="-1">Показывать сетку</div>
</div>
```

Скринридер: «Действия, кнопка, меню, свёрнуто» → Enter → «Переименовать, пункт меню, 1 из 3».

## Код по частям

### Кнопка

```tsx
onKeyDown={composeHandlers(onKeyDown, (event) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  menu.startFrom.current = event.key === 'ArrowUp' ? 'last' : 'first'
  menu.setOpen(true)
})}
```

Enter и Пробел на `<button>` и так вызывают `click` — их отдельно обрабатывать не нужно. Стрелки
— свои. `startFrom` — `ref`, а не состояние: это подсказка для эффекта открытия, перерисовка из-за
неё не нужна. `preventDefault` — иначе стрелка ещё и прокрутит страницу.

### Открылось — фокус на пункт; закрылось — на кнопку

```tsx
useEffect(() => {
  const element = content.current
  if (!menu.open || !element) return
  const items = getItems(element, ITEM)
  ;(menu.startFrom.current === 'last' ? items[items.length - 1] : items[0])?.focus({ preventScroll: true })
  const trigger = menu.trigger.current
  return () => {
    if (element.contains(document.activeElement) || document.activeElement === document.body) trigger?.focus({ preventScroll: true })
  }
}, [menu.open, menu.trigger, menu.startFrom])
```

Возвращаем фокус на кнопку **только если** он был в меню (или потерялся на `<body>`). Если
человек закрыл меню кликом по полю ввода, фокус должен остаться в поле, а не прыгнуть на кнопку.

### Клавиатура внутри меню

```tsx
onKeyDown={composeHandlers(onKeyDown, (event) => {
  if (event.key === 'Tab') return menu.setOpen(false)
  if (moveFocus(event, ITEM, { orientation: 'vertical' })) return
  const items = getItems(event.currentTarget, ITEM)
  const found = typeahead(event.key, items.map((item) => item.textContent ?? ''), items.indexOf(document.activeElement))
  if (found >= 0) items[found]?.focus()
})}
```

Три ветки по очереди: Tab закрывает (и не отменяется — фокус уйдёт дальше по странице); стрелки
двигают; буквы ищут.

### `moveFocus` и `nextIndex` — стрелки без своего списка

```ts
export function nextIndex(key, current, count, { orientation, loop = true }) {
  if (count === 0) return null
  const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  const step = (delta) => {
    const index = current + delta
    if (loop) return (index + count) % count
    return Math.min(Math.max(index, 0), count - 1)
  }
  if (key === next) return current < 0 ? 0 : step(1)
  if (key === prev) return current < 0 ? count - 1 : step(-1)
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}
```

Чистая функция «какой индекс станет текущим» — общая для вкладок (горизонтально), меню и
аккордеона (вертикально). `null` — клавиша не про навигацию, пусть обработает кто-то ещё.

```ts
export const getItems = (container, selector) =>
  Array.from(container.querySelectorAll(selector)).filter((item) => !item.hasAttribute('data-disabled') && !item.disabled)
```

Пункты ищутся **в DOM** по селектору при каждом нажатии: компоненту не нужно вести список
пунктов, а выключенные сами выпадают из обхода.

### Поиск по буквам

```ts
const text = now - state.current.at > 500 ? key : state.current.text + key
…
const sameLetter = query.split('').every((char) => char === query[0])
const needle = sameLetter ? query[0]! : query
const start = sameLetter ? current + 1 : Math.max(current, 0)
```

- Буквы копятся, пока между нажатиями меньше 500 мс: «пе» → «Переименовать».
- «ддд» — одна и та же буква: перебор пунктов на «д» по кругу, начиная со следующего.
- Пробел в начале — это «выбрать», а не поиск.

### Пункт

```tsx
function useItem({ onSelect, disabled, closeOnSelect }) {
  const select = () => {
    if (disabled) return
    const event = new Event('select', { cancelable: true })
    onSelect?.(event)
    if (closeOnSelect && !event.defaultPrevented) menu.setOpen(false)
  }
  return {
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    onClick: select,
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      select()
    },
    onPointerMove: (event) => {
      if (!disabled && event.pointerType === 'mouse') event.currentTarget.focus({ preventScroll: true })
    },
  }
}
```

- **Своё событие `select`** — одно и то же для клика и клавиши, и его можно отменить. Исходное
  событие клавиши не годится: мы сами вызываем у него `preventDefault` (чтобы Пробел не прокрутил
  страницу), и пользователь не отличил бы «я отменил» от «так было».
- `tabIndex: -1` — по пунктам ходят стрелками, фокус ставит код.
- `aria-disabled`, а не `disabled`: выключенный пункт **виден** скринридеру («недоступно»), но
  стрелки его пропускают (`data-disabled`).
- **Наведение = фокус** (`pointermove`, только мышь): иначе одновременно были бы подсветка под
  курсором и под клавиатурой — и Enter выбрал бы не то, что подсвечено мышью.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| пункты с `tabIndex={0}` | Tab проходит по каждому пункту вместо выхода из меню |
| вернуть фокус на кнопку всегда | клик в поле ввода при открытом меню — фокус прыгает на кнопку |
| `onSelect` получает событие клавиши | нельзя понять, отменил ли пользователь закрытие |
| без `onPointerMove` | две подсветки: мышь и клавиатура |

## Проверьте себя

1. Почему Enter на кнопке меню не обрабатывается отдельно?
2. В меню пункты «Дублировать», «Добавить», «Удалить». Откройте его и нажмите «д» три раза. Где
   будет фокус после каждого нажатия?
3. Почему меню, а не `<nav>`, для «Переименовать / Удалить»?

<details>
<summary>Ответы</summary>

1. На `<button>` Enter и Пробел сами вызывают `click`, а он уже открывает меню.
2. Меню открылось на «Дублировать». «д» → «Добавить» (поиск со следующего пункта), ещё «д» →
   «Дублировать» (по кругу), ещё «д» → снова «Добавить». «Удалить» начинается на «у» — его поиск
   не задевает.
3. Это действия над объектом, а не переходы по сайту. `role="menu"` обещает скринридеру
   поведение меню приложения (стрелки, Escape).
</details>
