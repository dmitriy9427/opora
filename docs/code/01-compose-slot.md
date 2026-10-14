# 1. Кубики: compose и Slot

[src/primitives/compose.ts](../../src/primitives/compose.ts), [src/primitives/slot.tsx](../../src/primitives/slot.tsx)

## Где это

Нигде на экране — и везде: на этих 150 строках стоят все компоненты.

## Что делает

| Функция | Зачем |
| --- | --- |
| `cx(...)` | склеить классы, пропуская пустые |
| `composeRefs(...)` | один элемент — несколько `ref` |
| `composeHandlers(theirs, ours)` | сначала обработчик пользователя, потом наш — если он не отменил |
| `useControllableState` | управляемый и неуправляемый режим одним хуком |
| `useLatest(value)` | свежее значение для обработчиков, подписанных один раз |
| `Slot` + `mergeProps` | `asChild`: отдать поведение ребёнку |

## `cx`

```ts
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ') || undefined
```

`cx('op-button', className)` → `'op-button my'` или `'op-button'`. В конце `|| undefined`: пустая
строка дала бы в DOM `class=""`, а `undefined` — атрибута нет вовсе.

## `composeRefs`

```ts
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    const cleanups: (() => void)[] = []
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        if (typeof cleanup === 'function') cleanups.push(cleanup)
        else cleanups.push(() => ref(null))
      } else if (ref) {
        ref.current = node
        cleanups.push(() => { ref.current = null })
      }
    }
    return () => cleanups.forEach((cleanup) => cleanup())
  }
}
```

Зачем: диалогу нужен свой `ref` на кнопку (вернуть на неё фокус), а пользователь тоже передал
`ref`. На элементе может быть только один атрибут `ref` — значит, нужен **один** ref-колбэк,
который раздаёт узел всем.

- `ref` бывает двух видов: функция `(node) => …` и объект `{ current }`. Обрабатываем оба.
- В React 19 ref-функция может вернуть **очистку** — её вызовут при размонтировании (вместо
  старого вызова с `null`). Собираем все очистки и возвращаем одну общую.

## `composeHandlers`

```ts
export function composeHandlers(theirs, ours) {
  return (event) => {
    theirs?.(event)
    if (!event.defaultPrevented) ours(event)
  }
}
```

```tsx
<DialogTrigger onClick={(e) => { if (!saved) e.preventDefault() }}>Закрыть</DialogTrigger>
```

Пользователь вызывается **первым** и может сказать «стоп» (`preventDefault`) — наше поведение
не выполнится. Так он управляет компонентом, не переписывая его.

## `useControllableState`

```ts
export function useControllableState<T>({ value, defaultValue, onChange }) {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  const setValue = useCallback((next: T) => {
    if (!controlled) setInner(next)
    onChangeRef.current?.(next)
  }, [controlled])
  return [current, setValue] as const
}
```

Как у `<input>`: либо `defaultValue` (компонент хранит сам), либо `value` + `onChange`
(хранит родитель).

| Режим | `value` | Что делает `setValue` |
| --- | --- | --- |
| неуправляемый | `undefined` | меняет своё `inner` и сообщает наружу |
| управляемый | есть | только сообщает наружу — менять будет родитель |

`onChange` лежит в `ref`: иначе `setValue` пересоздавался бы при каждом рендере родителя
(стрелка в JSX — новая функция), и все, кто от него зависят, перезапускались бы.

## `useLatest` и `useIsomorphicLayoutEffect`

```ts
export const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect

export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useIsomorphicLayoutEffect(() => { ref.current = value })
  return ref
}
```

Обработчик слоя подписывается на `document` один раз, а `onDismiss` у компонента каждый рендер
новый. `useLatest` даёт «коробку», где всегда лежит свежая версия. Layout-эффект — чтобы
коробка обновилась до того, как браузер обработает следующее событие. На сервере
`useLayoutEffect` бесполезен и React о нём предупреждает — там подставляется `useEffect`.

## `Slot` — приём `asChild`

```tsx
<Button asChild variant="primary"><a href="/docs">Документация</a></Button>
// → <a href="/docs" class="op-button" data-variant="primary">Документация</a>
```

```tsx
export function Slot({ children, ref, ...props }) {
  if (!isValidElement(children)) {
    if (process.env.NODE_ENV !== 'production') console.error('[opora] asChild ждёт ровно один React-элемент в children')
    return null
  }
  const child = children
  return cloneElement(child, {
    ...mergeProps(props, child.props),
    ref: composeRefs(ref, child.props.ref),
  })
}
```

`Slot` **не рисует** своего тега: берёт единственного ребёнка и клонирует его с добавленными
пропсами. `process.env.NODE_ENV` — сборщик приложения подставит `'production'`, и ветка с
предупреждением исчезнет из сборки.

```ts
export function mergeProps(slot, child) {
  const merged = { ...slot, ...child }
  for (const key of Object.keys(slot)) {
    const ours = slot[key], theirs = child[key]
    if (/^on[A-Z]/.test(key) && typeof ours === 'function' && typeof theirs === 'function') {
      merged[key] = (...args) => {
        theirs(...args)
        if (!args[0]?.defaultPrevented) ours(...args)
      }
    } else if (key === 'className') merged[key] = cx(ours, theirs)
    else if (key === 'style') merged[key] = { ...ours, ...theirs }
  }
  return merged
}
```

| Проп | Правило |
| --- | --- |
| обработчики `onX` | оба: сначала ребёнка (он ближе к пользователю), потом наш |
| `className` | склеить |
| `style` | слить, ребёнок важнее |
| остальное | ребёнок важнее (`{ ...slot, ...child }`) |

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| один `ref` вместо `composeRefs` | либо диалог не вернёт фокус, либо пользователь не получит элемент |
| наш обработчик первым | пользователь не сможет отменить поведение |
| `onChange` в зависимостях `useCallback` | `setValue` новый каждый рендер — лишние перезапуски эффектов |
| `{ ...child, ...slot }` в `mergeProps` | атрибуты кнопки затрут `href` и `className` ребёнка |

## Проверьте себя

1. Что вернёт `cx(false, undefined)`?
2. `<Tabs value="b">` без `onValueChange` — что будет при клике на вкладку «c»?
3. Почему `asChild` лучше, чем `<Button><a href>…</a></Button>`?

<details>
<summary>Ответы</summary>

1. `undefined` — атрибута `class` не будет.
2. Ничего не изменится: режим управляемый, значение `b` держит родитель. `setValue` только
   сообщает наружу.
3. Интерактивный элемент внутри интерактивного недопустим: два элемента в обходе Tab,
   скринридер видит «кнопку» вместо ссылки.
</details>
