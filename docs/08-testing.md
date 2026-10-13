# 08. Тесты

```bash
npm test          # 133 теста, ~3 секунды
```

| Файл | Тестов | Что проверяет |
| --- | --- | --- |
| `primitives/position.test.ts` | 9 | расчёт координат: стороны, flip, shift, доступная высота |
| `primitives/list.test.ts` | 12 | стрелки, Home/End, поиск по буквам |
| `primitives/compose.test.tsx` | 8 | `cx`, ref, обработчики, управляемое состояние, `Slot` |
| `button/button.test.tsx` | 6 | типы кнопки, loading, asChild |
| `field/field.test.tsx` | 17 | поля, чекбокс, переключатель, радиогруппа |
| `tabs/tabs.test.tsx` | 16 | вкладки и аккордеон |
| `dialog/dialog.test.tsx` | 14 | фокус, inert, Escape, вложенные слои |
| `menu/menu.test.tsx` | 25 | меню, поповер, подсказка |
| `select/select.test.tsx` | 15 | клавиатура, формы, Field |
| `toast/toast.test.tsx` | 11 | таймеры, пауза, обновление, живые области |

## Тестировать как пользователь

Testing Library ищет элементы так, как их находит человек или скринридер, — **по роли и имени**:

```ts
screen.getByRole('button', { name: 'Сохранить' })
screen.getByRole('dialog', { name: 'Новый проект' })
screen.getByRole('tab', { name: 'Доступ' })
```

Не по классу и не по `data-testid`. Следствие: **если тест нашёл элемент по роли и имени,
значит, его найдёт и скринридер**. Тест с `getByRole('combobox', { name: 'Город' })` не
пройдёт, пока подпись не связана с селектом. Доступность проверяется попутно.

Действия — через `user-event`, который имитирует настоящие события (нажатие — это
pointerdown, mousedown, focus, pointerup, mouseup, click):

```ts
await userEvent.tab()
await userEvent.keyboard('{ArrowDown}{Enter}')
await userEvent.click(screen.getByRole('button', { name: 'Открыть' }))
await userEvent.hover(element)
```

Проверки — утверждения про доступность, а не про классы:

```ts
expect(button).toHaveFocus()
expect(input).toHaveAccessibleDescription('Не короче 8 символов')
expect(input).toBeInvalid()
expect(trigger).toHaveAttribute('aria-expanded', 'true')
expect(checkbox).toBePartiallyChecked()
```

## Тест как описание поведения

```ts
it('Tab ходит по кругу внутри окна и не выходит наружу', async () => { … })
it('меню внутри диалога: Escape закрывает только меню, второй — диалог', async () => { … })
it('таймер стоит, пока на уведомлениях курсор, и продолжается с того же места', async () => { … })
it('loading: остаётся в фокусе, объявляет занятость и не выполняет нажатие', async () => { … })
```

Откройте любой файл тестов и прочитайте только строки `it(…)` — получится спецификация
компонента.

## axe: автоматическая проверка доступности

```ts
it('доступность открытого окна', async () => {
  render(<Example />)
  await open()
  await expectNoA11yViolations()
})
```

`src/test/a11y.ts` запускает `axe-core` на отрисованном. У каждого компонента такой тест —
в том числе в **открытом** состоянии (диалог, меню, список селекта): закрытое проверять
почти бессмысленно.

Что axe ловит: нет имени у кнопки или поля, неверные и недопустимые роли, `aria-*`
ссылается на несуществующий id, интерактивное внутри интерактивного, повторяющиеся id.

## Время

```ts
vi.useFakeTimers({ shouldAdvanceTime: true })
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

act(() => void toast('Привет', { duration: 3000 }))
advance(2900); expect(screen.getByText('Привет')).toBeInTheDocument()
advance(400);  expect(screen.queryByText('Привет')).toBeNull()
```

Тест «тост исчезает через 5 секунд» не идёт 5 секунд. `user-event` нужно сказать, как
двигать поддельное время, иначе его внутренние задержки зависнут.

## Чего jsdom не видит

jsdom — имитация браузера без раскладки и отрисовки. Он не знает:

| Чего нет | К чему привело |
| --- | --- |
| раскладки (`getBoundingClientRect` → нули) | позиционирование проверить нельзя → расчёт вынесен в чистую функцию `computePosition` и тестируется числами |
| стилей | контраст не проверить → `color-contrast` в тестах выключен |
| `visibility: hidden` запрещает фокус | в jsdom фокус на скрытом элементе «работает» |
| `inert` запрещает фокус | то же |
| анимаций | `usePresence` в тестах удаляет элемент сразу |

Три бага из [lessons.md](lessons.md) (№3, №4, №6) тесты в jsdom пропустили. Их нашла
проверка в настоящем браузере.

## Проверка в браузере

При разработке каждая история Storybook открывалась в Chrome через Playwright:

- `axe` **с контрастом**, в светлой и тёмной теме — 22 истории × 2;
- сценарии с клавиатурой: фокус в диалоге, Escape по слоям, Пробел в меню;
- геометрия: список селекта под кнопкой и не уже её; меню `bottom-end` — по правому краю;
  в низком окне список не вылезает за экран; высота аккордеона меняется плавно.

В самом Storybook то же видно руками: вкладка **Accessibility** у каждой истории.

Следующий шаг для проекта — перенести эти сценарии в репозиторий: Vitest в режиме браузера
или Playwright Component Testing. Здесь это не сделано, чтобы CI не скачивал браузер.

## Как закрепить баг, который jsdom не видит

Иногда можно проверить **причину**, а не следствие:

```ts
it('фокус возвращается ПОСЛЕ того, как страница снова доступна', async () => {
  let inertAtFocus = null
  vi.spyOn(trigger, 'focus').mockImplementation(() => { inertAtFocus = container.hasAttribute('inert') })
  await userEvent.keyboard('{Escape}')
  expect(inertAtFocus).toBe(false)
})
```

jsdom не запретит фокус на `inert`-элементе, но порядок действий проверить можно.

## Проверка пакета — тоже тест

`npm run test:package` (глава 02) проверяет то, что видит пользователь: архив, типы, загрузку
в Node, серверный рендеринг. Модульные тесты этого не покрывают в принципе.
