# 4. Диалог

[src/components/dialog/dialog.tsx](../../src/components/dialog/dialog.tsx) и примитивы
[layers.ts](../../src/primitives/layers.ts), [focus.ts](../../src/primitives/focus.ts),
[presence.ts](../../src/primitives/presence.ts), [portal.tsx](../../src/primitives/portal.tsx).
Глава — [06. Всплывающие слои](../06-overlays.md).

## Где это

«Удалить проект?», «Новая задача», «Настройки». Окно поверх страницы, страница затемнена.

## Что делает

1. Объявляет себя скринридеру: `role="dialog"`, `aria-modal`, название и описание.
2. Уводит фокус внутрь и не выпускает по Tab.
3. Выключает всё вокруг атрибутом `inert`.
4. Закрывается по Escape (а если сверху открыто меню — Escape закрывает сначала меню).
5. После закрытия возвращает фокус на кнопку, которая его открыла.
6. Блокирует прокрутку страницы.
7. Доигрывает анимацию закрытия.

## Пример

```tsx
<Dialog>
  <DialogTrigger asChild><Button variant="danger">Удалить проект</Button></DialogTrigger>
  <DialogContent
    role="alertdialog"
    title="Удалить проект?"
    description="Задачи и файлы удалятся без возможности восстановления."
    footer={<>
      <DialogClose asChild><Button>Отмена</Button></DialogClose>
      <Button variant="danger" onClick={remove}>Удалить</Button>
    </>}
  />
</Dialog>
```

| Часть | Что это |
| --- | --- |
| `Dialog` | хранит «открыт ли» и общие id; ничего не рисует |
| `DialogTrigger` | кнопка, открывающая окно |
| `DialogContent` | само окно (в портале) |
| `DialogClose` | любая кнопка, закрывающая окно |

`role="alertdialog"` — окно, требующее ответа: не закрывается кликом мимо.

## Составной компонент: контекст

```tsx
export function Dialog({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  return (
    <DialogContext value={{ open: isOpen, setOpen, trigger, titleId: `${id}-title`, descriptionId: `${id}-description` }}>
      {children}
    </DialogContext>
  )
}
```

Части связаны **контекстом**: кнопка и окно могут стоять где угодно внутри `Dialog`. `trigger`
— ссылка на кнопку: ловушка фокуса вернёт фокус туда. `useDialog(name)` бросает понятную ошибку,
если часть вынесли из `Dialog`.

```tsx
export function DialogTrigger({ asChild = false, onClick, ref, ...props }) {
  const dialog = useDialog('DialogTrigger')
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...(asChild ? {} : { type: 'button' })}
      aria-haspopup="dialog"
      aria-expanded={dialog.open}
      ref={composeRefs(dialog.trigger, ref)}
      onClick={composeHandlers(onClick, () => dialog.setOpen(true))}
      {...props}
    />
  )
}
```

`aria-haspopup="dialog"` — скринридер заранее скажет, что кнопка открывает окно.

## `DialogContent`: пять хуков

```tsx
const presence = usePresence(dialog.open)

useLayer({ open: dialog.open, content: root, onDismiss: () => dialog.setOpen(false), closeOnOutside: false })
useInertOthers(root, dialog.open)
useFocusTrap(panel, dialog.open)
useScrollLock(dialog.open)

if (!presence.present) return null
```

**Порядок `useInertOthers` → `useFocusTrap` важен.** При закрытии React вызывает уборку эффектов
в порядке объявления: сначала страница перестаёт быть `inert`, **потом** ловушка возвращает фокус
на кнопку. Наоборот — фокус пытался бы встать на ещё выключенную кнопку и молча терялся бы. Это
закреплено тестом «фокус возвращается ПОСЛЕ того, как страница снова доступна».

### `useLayer` — стопка слоёв

```ts
const stack: Layer[] = []

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  const top = stack[stack.length - 1]
  if (!top?.closeOnEscape) return
  event.preventDefault()
  top.dismiss('escape')
}
```

Одна стопка на всю библиотеку. Открылся слой — лёг сверху. **Escape достаётся верхнему**: меню
из диалога закроется, диалог останется. Обработчики на `document` — одни на всех: включаются
при первом слое и выключаются, когда стопка опустела.

```ts
function onPointerDown(event: PointerEvent) {
  let hit = -1
  for (let i = stack.length - 1; i >= 0; i--) {
    if (contains(stack[i]!, event.target as Node)) { hit = i; break }
  }
  for (const layer of stack.slice(hit + 1).reverse()) {
    if (!layer.closeOnOutside) break
    layer.dismiss('outside')
  }
}
```

Клик «мимо» закрывает все слои **выше** того, в который кликнули. Слой, который кликом мимо не
закрывается (alertdialog), защищает и всё под ним (`break`). Слушаем на фазе перехвата
(`capture`) — узнаём о клике раньше, чем кто-то на странице его остановит.

### `useInertOthers` — выключить всё вокруг

```ts
let node = container
while (node && node !== document.body) {
  const parent = node.parentElement
  for (const sibling of parent.children) {
    if (sibling === node || sibling.hasAttribute('inert') || sibling.hasAttribute('data-op-keep')) continue
    sibling.setAttribute('inert', '')
    changed.push(sibling)
  }
  node = parent
}
```

Поднимаемся от окна к `<body>` и на каждом уровне выключаем «братьев». В итоге выключено всё,
кроме ветки с окном. `inert` убирает элементы из фокуса, кликов **и** из дерева скринридера —
одной ловушки фокуса для этого мало: в режиме чтения скринридер прошёл бы мимо неё.

- Уже выключенное не трогаем и не включаем потом (его выключил кто-то другой).
- `data-op-keep` — исключение: область тостов. Уведомление, пришедшее при открытом окне, должно
  быть доступно.

### `useFocusTrap` — фокус внутри

```ts
const previous = document.activeElement
const initial = container.querySelector('[autofocus], [data-autofocus]') ?? getTabbable(container)[0] ?? container
initial.focus({ preventScroll: true })
```

- Запоминаем, где был фокус, — туда вернёмся.
- Куда поставить: на `data-autofocus` (например, «Отмена» в опасном диалоге), иначе на первый
  доступный элемент, иначе на саму панель (у неё `tabIndex={-1}` ровно для этого).

```ts
const onKeyDown = (event) => {
  if (event.key !== 'Tab') return
  const tabbable = getTabbable(container)
  …
  if (event.shiftKey && (current === first || current === container)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && current === last) { event.preventDefault(); first.focus() }
}
```

Tab с последнего — на первый, Shift+Tab с первого — на последний. Список берётся **заново** на
каждое нажатие: содержимое окна могло измениться.

```ts
const onFocusIn = (event) => {
  if (container.contains(event.target) || isInLayerAbove(container, event.target)) return
  ;(getTabbable(container)[0] ?? container).focus()
}
```

Фокус мог уйти не по Tab (программно, жестом скринридера) — возвращаем. Но меню, открытое из
диалога, живёт в своём портале вне окна — это не побег (`isInLayerAbove`).

```ts
return () => {
  …
  if (previous?.isConnected) previous.focus({ preventScroll: true })
}
```

`isConnected` — кнопки может уже не быть (удалили строку, из которой открыли окно).

### `useScrollLock`

Счётчик, как в ките: два окна друг над другом — прокрутка вернётся, когда закрыты оба. Ширина
исчезнувшей полосы прокрутки компенсируется `padding-right`, чтобы страница не дёрнулась.

### `usePresence` — анимация закрытия

```ts
const [present, setPresent] = useState(open)
if (open && !present) setPresent(true)
```

`{open && <div/>}` удалил бы окно мгновенно. `usePresence` держит его в DOM ещё на время
анимации:

| `open` | `present` | `data-state` |
| --- | --- | --- |
| `true` | `true` | `open` — играет анимация входа |
| `false` | `true` | `closed` — играет анимация выхода |
| после `animationend` | `false` | элемента нет |

- `setPresent(true)` прямо в рендере (а не в эффекте) — иначе был бы кадр без окна.
- Если у элемента нет анимации (или «уменьшить движение») — удаляем сразу: `animationend` не
  придёт никогда.
- `event.target === element` — анимации детей всплывают сюда же; ждём именно свою.

### Портал

```tsx
const mounted = useSyncExternalStore(subscribe, () => true, () => false)
return mounted ? createPortal(children, container ?? document.body) : null
```

Окно рисуется в конце `<body>`: внутри карточки с `overflow: hidden` оно было бы обрезано. В
дереве React оно остаётся на месте — контекст и всплытие событий работают. На сервере `document`
нет: `useSyncExternalStore` с разными снимками для сервера и браузера говорит «только в браузере»
без ошибки гидрации.

### Разметка окна

```tsx
<div className="op-dialog" data-state={presence.state} ref={composeRefs(root, presence.ref)}>
  <div className="op-dialog__backdrop" onPointerDown={() => closeOnOutside && dialog.setOpen(false)} />
  <div role={role} aria-modal="true" aria-labelledby={dialog.titleId}
       aria-describedby={description ? dialog.descriptionId : undefined} tabIndex={-1} …>
    <h2 id={dialog.titleId}>{title}</h2>
    {!hideClose && <button type="button" aria-label="Закрыть" onClick={() => dialog.setOpen(false)}>…</button>}
    {description && <p id={dialog.descriptionId}>{description}</p>}
    …
  </div>
</div>
```

- Клик по затемнению — `pointerdown`, а не `click`: выделение текста в окне, законченное мышью за
  его пределами, вызвало бы `click` по затемнению и закрыло окно.
- `title` обязателен — без названия скринридер скажет просто «диалог».

## Что будет, если…

| Убрать | Что сломается |
| --- | --- |
| `useInertOthers` | скринридер в режиме чтения читает страницу под окном |
| порядок inert → trap | после закрытия фокус теряется на `<body>` |
| `isInLayerAbove` в ловушке | меню внутри диалога: фокус выдёргивается из меню обратно в окно |
| `usePresence` | окно исчезает без анимации |
| `previous?.isConnected` | ошибка при возврате фокуса на удалённую кнопку |

## Проверьте себя

1. Из диалога открыто меню. Пользователь кликнул внутри диалога, но мимо меню. Что закроется?
2. Почему у панели `tabIndex={-1}`, а не `0`?
3. Зачем область тостов помечена `data-op-keep`?

<details>
<summary>Ответы</summary>

1. Только меню: `hit` — индекс диалога, закрываются слои выше него.
2. Панель должна принимать фокус **программно** (если внутри нет кнопок), но не быть лишней
   остановкой при обходе Tab.
3. Чтобы `useInertOthers` её не выключил: уведомление при открытом окне должно читаться и
   нажиматься.
</details>
