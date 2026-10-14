# 3. Поле и чекбокс

[src/components/field/field.tsx](../../src/components/field/field.tsx),
[src/components/checkbox/checkbox.tsx](../../src/components/checkbox/checkbox.tsx)

## Где это

Любая форма: «Почта» с подсказкой «Пришлём чек» и ошибкой «Не похоже на почту»; флажок
«Согласен с условиями».

## Что делают

**Field:**
- связывает подпись, поле, подсказку и ошибку: клик по подписи ставит курсор, скринридер читает
  всё вместе;
- помечает поле неверным (`aria-invalid`) и зачитывает ошибку при появлении;
- передаёт `id`, `required`, `disabled` полю **через контекст** — `Input` ничего не пишет руками.

**Checkbox:**
- внутри настоящий `<input type="checkbox">`, невидимый, а «коробочка» нарисована рядом;
- поддерживает «частично» (`indeterminate`);
- клик по тексту переключает флажок.

## Пример

```tsx
<Field label="Почта" hint="Пришлём чек" error={errors.email} required>
  <Input type="email" name="email" />
</Field>

<Checkbox name="terms" required>Согласен с условиями</Checkbox>
<Checkbox checked={some} indeterminate={some && !all} onChange={toggleAll}>Выбрать всё</Checkbox>
```

Что увидит скринридер у поля: «Почта, обязательное, поле ввода, недопустимое значение, Не похоже
на почту, Пришлём чек».

## Field: код по частям

```tsx
export function Field({ label, hint, error, required = false, disabled = false, className, children, ...props }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const invalid = Boolean(error)
  const describedBy = [invalid && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
```

- `useId()` — уникальный id, одинаковый на сервере и в браузере (не ломает гидрацию).
- `describedBy` — **сначала ошибка**, потом подсказка: скринридер прочитает важное первым.

```tsx
  return (
    <div className={cx('op-field', className)} data-invalid={invalid || undefined} data-disabled={disabled || undefined} {...props}>
      <label className="op-field__label" htmlFor={id}>
        {label}
        {required && <span className="op-field__required" aria-hidden>*</span>}
      </label>
      <FieldContext value={{ id, describedBy, invalid, required, disabled }}>{children}</FieldContext>
      {hint && <p className="op-field__hint" id={hintId}>{hint}</p>}
      {invalid && <p className="op-field__error" id={errorId} role="alert">{error}</p>}
    </div>
  )
}
```

- `htmlFor={id}` ↔ `id` поля — связь подписи с полем.
- Звёздочка `aria-hidden`: «обязательное» скринридер узнает из `required`, а «звёздочка» ему не
  нужна.
- `role="alert"` у ошибки — новая ошибка зачитывается сразу.
- `<FieldContext value>` — в React 19 контекст можно рендерить как провайдер напрямую.

### `useFieldControl` — поле берёт атрибуты из контекста

```ts
export function useFieldControl(props) {
  const field = use(FieldContext)
  if (!field) return props
  return {
    ...props,
    id: props.id ?? field.id,
    disabled: props.disabled ?? (field.disabled || undefined),
    required: props.required ?? (field.required || undefined),
    'aria-describedby': [props['aria-describedby'], field.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
  }
}

export function Input({ size = 'md', className, ...props }) {
  return <input className={cx('op-input', className)} data-size={size} {...useFieldControl(props)} />
}
```

- Вне `Field` — пропсы как есть: `Input` работает и сам по себе.
- **Свои пропсы важнее контекста** (`props.id ?? field.id`): id можно задать вручную.
- `aria-describedby` **склеивается**: если у поля было своё описание, оно не пропадёт.
- `use(FieldContext)` — новый API React 19, то же, что `useContext`.

Этим же хуком пользуется `Select` — поэтому селект внутри `Field` тоже получает подпись и
ошибку.

## Checkbox: код по частям

```tsx
export function Checkbox({ children, indeterminate = false, className, style, ref, ...props }) {
  const inner = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate
  }, [indeterminate])
```

`indeterminate` («частично») нельзя задать атрибутом в HTML — только свойством DOM-элемента.
Поэтому эффект и свой `ref`.

```tsx
  return (
    <label className={cx('op-checkbox', className)} style={style} data-disabled={props.disabled || undefined}>
      <input type="checkbox" className="op-checkbox__input" ref={composeRefs(inner, ref)} {...props} />
      <span className="op-checkbox__box" aria-hidden>
        <svg …><path className="op-checkbox__check" d="M3.5 8.5l3 3 6-7" /><path className="op-checkbox__dash" d="M4 8h8" /></svg>
      </span>
      {children && <span className="op-checkbox__label">{children}</span>}
    </label>
  )
}
```

**Главный приём для элементов форм: поведение — браузерное, вид — свой.**

Настоящий `<input>` бесплатно даёт: Пробел переключает, значение уходит с формой, `required`
работает, автозаполнение и скринридер понимают его. `<div role="checkbox">` потребовал бы
написать всё это заново.

- `<label>` вокруг — клик по тексту переключает флажок, область нажатия — вся строка.
- Коробочка `aria-hidden` — для скринридера есть настоящий `<input>`.
- `composeRefs(inner, ref)` — нам ref нужен для `indeterminate`, пользователю — для своего.

Как спрятан `<input>`, но оставлен доступным — в CSS: он лежит **поверх** коробочки прозрачным
(`opacity: 0`), а не убран через `display: none` — иначе пропал бы из обхода Tab. Стиль фокуса
рисуется на коробочке по `:focus-visible` соседнего инпута.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| `display: none` у инпута чекбокса | Tab его не находит, скринридер не видит |
| `<div role="checkbox">` | Пробел, `required`, отправка формы — всё писать заново |
| перезаписывать, а не склеивать `aria-describedby` | своя подсказка поля пропадёт для скринридера |
| ошибка без `role="alert"` | скринридер узнает об ошибке, только вернувшись к полю |

## Проверьте себя

1. Почему `indeterminate` выставляется в эффекте, а не атрибутом?
2. Как `Input` узнаёт `id`, если вы его не передавали?
3. Что прочитает скринридер у обязательного поля со звёздочкой?

<details>
<summary>Ответы</summary>

1. В HTML нет такого атрибута — только свойство `input.indeterminate`.
2. Из контекста `Field` через `useFieldControl`.
3. «…, обязательное» — из атрибута `required`; звёздочка скрыта `aria-hidden`.
</details>
