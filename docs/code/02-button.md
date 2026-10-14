# 2. Кнопка

[src/components/button/button.tsx](../../src/components/button/button.tsx)

## Где это

Везде: «Сохранить», «Отмена», «Удалить», кнопка-значок с корзиной.

## Что делает

- Рисует настоящий `<button>` с вариантами вида и размерами.
- По умолчанию `type="button"` — не отправляет форму случайно.
- В состоянии загрузки показывает спиннер и не принимает нажатия, **оставаясь в фокусе**.
- С `asChild` отдаёт вид и поведение ребёнку (ссылке).
- Принимает всё, что принимает `<button>`: `onClick`, `disabled`, `aria-*`, `ref`.

## Пропсы

| Проп | Значения | Зачем |
| --- | --- | --- |
| `variant` | `primary` · `secondary` · `ghost` · `danger` | вид; `primary` — одна на экран |
| `size` | `sm` · `md` · `lg` | 32 / 40 / 48 px — как у полей того же размера |
| `loading` | `boolean` | идёт действие |
| `iconOnly` | `boolean` | квадратная кнопка-значок; нужен `aria-label` |
| `icon` | элемент | значок перед текстом |
| `asChild` | `boolean` | вид кнопки у ребёнка |
| …всё от `<button>` | | |

```tsx
<Button variant="primary" loading={saving} onClick={save}>Сохранить</Button>
<Button iconOnly aria-label="Удалить" icon={<TrashIcon />} variant="danger" />
<Button asChild><a href="/docs">Документация</a></Button>
```

## Код по частям

```tsx
export function Button({ variant = 'secondary', size = 'md', loading = false, iconOnly = false, icon,
  asChild = false, className, children, onClick, type, disabled, ...props }: ButtonProps) {
```

Свои пропсы вытаскиваем по имени, всё остальное — в `...props` и дальше на элемент. Так
работают любые атрибуты `<button>`, о которых библиотека не знает (`form`, `name`, `aria-controls`).

### `loading` без `disabled`

```tsx
  const handleClick = (event) => {
    if (loading) return event.preventDefault()
    onClick?.(event)
  }
```

Почему не `disabled={loading}`? У `disabled`-кнопки браузер отнимает фокус. Человек нажал Enter
на «Сохранить» — кнопка стала `disabled` — фокус «провалился» на `<body>`, и следующий Tab начнёт
с начала страницы. А скринридер просто замолчит. Поэтому кнопка остаётся в фокусе, а нажатия
игнорируются.

```tsx
  const shared = {
    className: cx('op-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-icon-only': iconOnly || undefined,
    'data-loading': loading || undefined,
    'aria-busy': loading || undefined,
    'aria-disabled': loading || undefined,
    onClick: handleClick,
    ...props,
  }
```

- **Вид — через `data-атрибуты`**, а не классы `op-button--primary`: CSS пишется
  `.op-button[data-variant='primary']`, и состояние видно в DevTools.
- `|| undefined` — `false` в атрибуте React записал бы как `data-loading="false"`; `undefined` —
  атрибута нет.
- `aria-busy` + `aria-disabled` — скринридер скажет «занято, недоступно» вместо тишины.

```tsx
  if (asChild) return <Slot {...shared}>{children}</Slot>

  return (
    <button type={type ?? 'button'} disabled={disabled} {...shared}>
      {loading ? <Spinner size="sm" label="" /> : icon}
      {children}
    </button>
  )
}
```

- С `asChild` спиннер и значок внутрь не вставляем: содержимое принадлежит ребёнку.
- `type ?? 'button'` — у `<button>` в форме тип по умолчанию `submit`.
- Спиннер заменяет значок, а не текст: ширина кнопки почти не прыгает, а текст «Сохранить» всё
  ещё читается.
- `label=""` у спиннера — он становится `aria-hidden`: кнопка уже `aria-busy`, второе «загрузка» скринридеру не нужно.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| `disabled={loading}` | фокус теряется на `<body>` при каждом сохранении |
| убрать `type ?? 'button'` | кнопка «Показать пароль» в форме отправляет форму |
| не вынимать `onClick` из пропсов | `...props` в конце `shared` перезапишет `handleClick`, и в `loading` нажатия снова сработают |
| `iconOnly` без `aria-label` | скринридер скажет просто «кнопка» |

## Проверьте себя

1. Почему `...props` стоит в конце объекта `shared`, а `onClick` вынут отдельно?
2. Как сделать кнопку «Удалить» без текста, но понятную скринридеру?

<details>
<summary>Ответы</summary>

1. Чтобы пользователь мог переопределить любой атрибут (например, `aria-label`), но `onClick`
   всегда шёл через `handleClick` с проверкой `loading` — поэтому его вынимают заранее.
2. `<Button iconOnly aria-label="Удалить" icon={<TrashIcon />} />`.
</details>
