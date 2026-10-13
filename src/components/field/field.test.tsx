import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { expectNoA11yViolations } from '../../test/a11y'
import { Checkbox } from '../checkbox/checkbox'
import { Radio, RadioGroup } from '../radio/radio'
import { Switch } from '../switch/switch'
import { Field, Input, Textarea } from './field'

describe('Field + Input', () => {
  it('подпись связана с полем: клик по подписи ставит курсор', async () => {
    render(
      <Field label="Почта">
        <Input type="email" />
      </Field>,
    )
    await userEvent.click(screen.getByText('Почта'))
    expect(screen.getByRole('textbox', { name: 'Почта' })).toHaveFocus()
  })

  it('подсказка и ошибка входят в описание поля; ошибка — первой', () => {
    render(
      <Field label="Пароль" hint="Не короче 8 символов" error="Слишком короткий">
        <Input />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Пароль' })
    expect(input).toHaveAccessibleDescription('Слишком короткий Не короче 8 символов')
    expect(input).toBeInvalid()
    expect(screen.getByRole('alert')).toHaveTextContent('Слишком короткий')
  })

  it('без ошибки поле не помечено как неверное', () => {
    render(
      <Field label="Имя" hint="Как в паспорте">
        <Input />
      </Field>,
    )
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('required и disabled передаются полю', () => {
    render(
      <Field label="Город" required disabled>
        <Input />
      </Field>,
    )
    expect(screen.getByRole('textbox')).toBeRequired()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('свои пропсы поля важнее контекста', () => {
    render(
      <Field label="Код" error="Ошибка">
        <Input id="my-id" aria-describedby="extra" />
      </Field>,
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('id', 'my-id')
    expect(input.getAttribute('aria-describedby')).toMatch(/^extra /)
  })

  it('Textarea работает так же', () => {
    render(
      <Field label="Комментарий" error="Обязательно">
        <Textarea />
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Комментарий' })).toBeInvalid()
  })

  it('Input без Field — обычное поле', () => {
    render(<Input aria-label="Поиск" />)
    expect(screen.getByRole('textbox', { name: 'Поиск' })).toBeInTheDocument()
  })
})

describe('Checkbox', () => {
  it('переключается кликом по подписи и клавишей Пробел', async () => {
    const onChange = vi.fn()
    render(<Checkbox onChange={onChange}>Согласен</Checkbox>)
    const checkbox = screen.getByRole('checkbox', { name: 'Согласен' })
    await userEvent.click(screen.getByText('Согласен'))
    expect(checkbox).toBeChecked()
    await userEvent.keyboard(' ')
    expect(checkbox).not.toBeChecked()
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('indeterminate выставляется свойством элемента', () => {
    const { rerender } = render(<Checkbox indeterminate aria-label="Все" />)
    expect(screen.getByRole('checkbox')).toBePartiallyChecked()
    rerender(<Checkbox aria-label="Все" />)
    expect(screen.getByRole('checkbox')).not.toBePartiallyChecked()
  })

  it('уходит в форму как обычный чекбокс', () => {
    render(
      <form data-testid="form">
        <Checkbox name="agree" value="yes" defaultChecked>
          Да
        </Checkbox>
      </form>,
    )
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('agree')).toBe('yes')
  })
})

describe('Switch', () => {
  it('объявляется как переключатель и переключается', async () => {
    render(<Switch>Уведомления</Switch>)
    const control = screen.getByRole('switch', { name: 'Уведомления' })
    expect(control).not.toBeChecked()
    await userEvent.click(control)
    expect(control).toBeChecked()
  })
})

describe('RadioGroup', () => {
  const group = (props: Partial<React.ComponentProps<typeof RadioGroup>> = {}) => (
    <RadioGroup label="Доставка" defaultValue="courier" {...props}>
      <Radio value="courier">Курьер</Radio>
      <Radio value="pickup">Самовывоз</Radio>
      <Radio value="post" disabled>
        Почта
      </Radio>
    </RadioGroup>
  )

  it('группа подписана, выбран вариант по умолчанию', () => {
    render(group())
    expect(screen.getByRole('group', { name: 'Доставка' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Курьер' })).toBeChecked()
  })

  it('стрелки переключают вариант и пропускают выключенный', async () => {
    const onValueChange = vi.fn()
    render(group({ onValueChange }))
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Курьер' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Самовывоз' })).toBeChecked()
    expect(onValueChange).toHaveBeenLastCalledWith('pickup')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Курьер' })).toBeChecked() // «Почта» выключена — по кругу
  })

  it('управляемый режим: значение меняет родитель', async () => {
    const onValueChange = vi.fn()
    render(group({ value: 'courier', defaultValue: undefined, onValueChange }))
    await userEvent.click(screen.getByRole('radio', { name: 'Самовывоз' }))
    expect(onValueChange).toHaveBeenCalledWith('pickup')
    expect(screen.getByRole('radio', { name: 'Курьер' })).toBeChecked()
  })

  it('в форму уходит одно значение под общим именем', () => {
    render(<form data-testid="form">{group({ name: 'delivery' })}</form>)
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('delivery')).toBe('courier')
  })

  it('Radio вне группы — понятная ошибка', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Radio value="x">x</Radio>)).toThrow(/RadioGroup/)
  })
})

it('доступность элементов форм', async () => {
  render(
    <form>
      <Field label="Почта" hint="Пришлём чек" required>
        <Input type="email" />
      </Field>
      <Field label="Комментарий" error="Обязательное поле">
        <Textarea />
      </Field>
      <Checkbox>Согласен с условиями</Checkbox>
      <Checkbox indeterminate aria-label="Выбрать все" />
      <Switch>Уведомления</Switch>
      <RadioGroup label="Доставка" error="Выберите способ" required>
        <Radio value="a">Курьер</Radio>
        <Radio value="b">Самовывоз</Radio>
      </RadioGroup>
    </form>,
  )
  await expectNoA11yViolations()
})
