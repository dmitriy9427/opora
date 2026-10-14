# 5. Позиционирование

[src/primitives/position.ts](../../src/primitives/position.ts)

## Где это

Меню под кнопкой «Ещё», список селекта, поповер, тултип. Откройте меню у нижнего края окна — оно
откроется **вверх**. У правого края — сдвинется влево, чтобы не вылезти за экран.

## Что делает

- Ставит всплывающий элемент у якоря: сторона (`top`, `bottom`, `left`, `right`) и выравнивание
  (`start`, `center`, `end`).
- **flip** — не помещается с нужной стороны, а с противоположной места больше: переворачивает.
- **shift** — вылезает вбок: сдвигает вдоль стороны до края экрана с отступом.
- Сообщает, сколько места осталось, — список селекта ограничит высоту и включит прокрутку.
- Пересчитывает при прокрутке (любого предка), ресайзе и изменении размеров.

## Пример

```ts
const { style, side } = usePosition(triggerRef, contentRef, { open, placement: 'bottom-start', offset: 4 })
return <div ref={contentRef} style={style} data-side={side}>…</div>
```

## Главная идея: расчёт — чистая функция

```ts
computePosition({
  anchor: { x: 100, y: 700, width: 120, height: 32 },
  floating: { width: 200, height: 180 },
  viewport: { width: 1280, height: 800 },
  placement: 'bottom-start',
})
// → { x: 100, y: 512, side: 'top', … }  — снизу места 68px, сверху 700: перевернули
```

Никакого DOM — только прямоугольники на входе и числа на выходе. Поэтому её проверяют тесты без
браузера (в jsdom размеры всё равно нулевые). Хук `usePosition` лишь измеряет элементы и зовёт её.

## Код по частям

### `place` — координаты без учёта краёв

```ts
function place(anchor, floating, side, align, offset) {
  const vertical = side === 'top' || side === 'bottom'
  const along = (start, anchorSize, size) =>
    align === 'start' ? start : align === 'end' ? start + anchorSize - size : start + (anchorSize - size) / 2
  return {
    x: vertical ? along(anchor.x, anchor.width, floating.width)
       : side === 'left' ? anchor.x - floating.width - offset : anchor.x + anchor.width + offset,
    y: vertical ? (side === 'top' ? anchor.y - floating.height - offset : anchor.y + anchor.height + offset)
       : along(anchor.y, anchor.height, floating.height),
  }
}
```

Две оси: **поперёк** стороны (снизу — `y` под якорем + зазор) и **вдоль** (`along`: по началу,
центру или концу якоря).

### `computePosition`

```ts
let [side, align] = parse(placement)
const needed = (vertical ? floating.height : floating.width) + offset + padding

if (space(anchor, viewport, side) < needed && space(anchor, viewport, OPPOSITE[side]) > space(anchor, viewport, side))
  side = OPPOSITE[side]
```

**flip** — только если с нужной стороны тесно **и** с противоположной просторнее. Иначе
переворачивать бессмысленно: там будет ещё хуже.

```ts
const clamp = (value, size, limit) => Math.min(Math.max(value, padding), Math.max(padding, limit - size - padding))
if (vertical) x = clamp(x, floating.width, viewport.width)
else y = clamp(y, floating.height, viewport.height)
```

**shift** — прижать к краям экрана вдоль стороны. Внутренний `Math.max(padding, …)` — если элемент
шире экрана, прижимаем к левому краю, а не уводим в минус.

```ts
const available = Math.max(0, Math.round(space(anchor, viewport, side) - offset - padding))
return { x: Math.round(x), y: Math.round(y), side, align, available }
```

`Math.round` — дробные координаты дают размытый текст.

### `usePosition`

```ts
useIsomorphicLayoutEffect(() => {
  if (!open) return setResult(null)
  update()
  window.addEventListener('scroll', update, true)
  window.addEventListener('resize', update)
  const observer = new ResizeObserver(update)
  if (floating.current) observer.observe(floating.current)
  if (anchor.current) observer.observe(anchor.current)
  return () => { … }
}, [open, update, anchor, floating])
```

- **Layout-эффект** — координаты нужны **до** отрисовки, иначе элемент мигнёт в левом верхнем
  углу.
- `scroll` с `true` (перехват) — событие прокрутки не всплывает, а прокручиваться может любой
  предок якоря (таблица, боковая панель).
- `ResizeObserver` — содержимое догрузилось, элемент вырос — пересчитать.

```ts
setResult((prev) => prev && prev.x === next.x && … ? prev : { … })
```

Новый объект — только при изменении: иначе прокрутка давала бы рендер на каждый кадр.

```ts
const style = {
  position: 'fixed', left: result?.x ?? 0, top: result?.y ?? 0, minWidth: result?.width,
  '--op-available-height': result ? `${result.available}px` : undefined,
  ...(result ? null : { opacity: 0, animation: 'none', pointerEvents: 'none' }),
}
```

- `position: fixed` — координаты относительно окна, как и `getBoundingClientRect`.
- Пока не посчитали — элемент в DOM (его нужно измерить), но невидим. Именно `opacity: 0`, а не
  `visibility: hidden`: скрытый так элемент нельзя сфокусировать, а меню ставит фокус на пункт
  сразу при открытии.
- Доступная высота — CSS-переменной: селект делает `max-height: var(--op-available-height)`.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| `useEffect` вместо layout-эффекта | меню мигает в углу экрана при открытии |
| `scroll` без `true` | прокрутка внутри таблицы — меню остаётся висеть |
| `visibility: hidden` до расчёта | фокус на первый пункт меню не встаёт |
| flip без сравнения сторон | у маленького окна меню скачет вверх-вниз, хотя лучше не стало |

## Проверьте себя

1. Якорь у правого края, `placement: 'bottom-start'`, меню шире оставшегося места. Что сделает
   функция — flip или shift?
2. Почему `computePosition` не читает DOM сама?

<details>
<summary>Ответы</summary>

1. Shift: сторона (снизу) подходит, вылезает только вбок — меню сдвинется влево до отступа от
   правого края.
2. Чтобы её можно было проверить тестами на числах, без браузера и без раскладки.
</details>
