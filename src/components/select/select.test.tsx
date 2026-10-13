import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { expectNoA11yViolations } from '../../test/a11y'
import { Field } from '../field/field'
import { Select, SelectOption } from './select'

const select = (props: Partial<React.ComponentProps<typeof Select>> = {}) => (
  <>
    <Field label="Город">
      <Select placeholder="Выберите город" {...props}>
        <SelectOption value="msk">Москва</SelectOption>
        <SelectOption value="mur">Мурманск</SelectOption>
        <SelectOption value="kzn" disabled>
          Казань
        </SelectOption>
        <SelectOption value="nsk">Новосибирск</SelectOption>
      </Select>
    </Field>
    <button>Дальше</button>
  </>
)

const combobox = () => screen.getByRole('combobox', { name: 'Город' })
const option = (name: string) => screen.getByRole('option', { name })
/** Пункт, который скринридер считает текущим. */
const active = () => document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '')?.textContent

describe('Select', () => {
  it('подписан через Field, показывает заполнитель, список закрыт', () => {
    render(select())
    expect(combobox()).toHaveTextContent('Выберите город')
    expect(combobox()).toHaveAttribute('aria-expanded', 'false')
    expect(combobox()).toHaveAttribute('aria-haspopup', 'listbox')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('клик открывает список; фокус остаётся на кнопке, активный пункт — через aria-activedescendant', async () => {
    render(select())
    await userEvent.click(combobox())
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(combobox()).toHaveFocus()
    expect(combobox()).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
    expect(active()).toBe('Москва')
  })

  it('выбор кликом: значение, подпись, закрытие, фокус на кнопке', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.click(combobox())
    await userEvent.click(option('Мурманск'))
    expect(onValueChange).toHaveBeenCalledWith('mur')
    expect(combobox()).toHaveTextContent('Мурманск')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(combobox()).toHaveFocus()
  })

  it('клавиатура: ↓ открывает, стрелки двигают активный пункт мимо выключенного, Enter выбирает', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toBe('Москва')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(active()).toBe('Новосибирск') // «Казань» выключена
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toBe('Новосибирск') // в списке — без хождения по кругу
    await userEvent.keyboard('{Home}')
    expect(active()).toBe('Москва')
    await userEvent.keyboard('{End}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('nsk')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('открывается на выбранном пункте, он отмечен aria-selected', async () => {
    render(select({ defaultValue: 'mur' }))
    await userEvent.click(combobox())
    expect(active()).toBe('Мурманск')
    expect(option('Мурманск')).toHaveAttribute('aria-selected', 'true')
    expect(option('Москва')).toHaveAttribute('aria-selected', 'false')
  })

  it('Escape закрывает без выбора', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.click(combobox())
    await userEvent.keyboard('{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(combobox()).toHaveFocus()
  })

  it('Tab выбирает активный пункт и уводит фокус дальше', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.click(combobox())
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.tab()
    expect(onValueChange).toHaveBeenCalledWith('mur')
    expect(screen.getByRole('button', { name: 'Дальше' })).toHaveFocus()
  })

  it('буквы: в закрытом селекте сразу выбирают, в открытом — двигают активный пункт', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.tab()
    await userEvent.keyboard('н')
    expect(onValueChange).toHaveBeenLastCalledWith('nsk')
    expect(screen.queryByRole('listbox')).toBeNull()

    // Буквы, набранные подряд, складываются в одно слово — ждём, пока «набор» закончится.
    await new Promise((resolve) => setTimeout(resolve, 550))
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('м')
    expect(active()).toBe('Москва')
  })

  it('выключенный пункт нельзя выбрать ни кликом, ни буквой', async () => {
    const onValueChange = vi.fn()
    render(select({ onValueChange }))
    await userEvent.click(combobox())
    await userEvent.click(option('Казань'))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(option('Казань')).toHaveAttribute('aria-disabled', 'true')
  })

  it('клик мимо закрывает', async () => {
    render(select())
    await userEvent.click(combobox())
    await userEvent.click(screen.getByRole('button', { name: 'Дальше' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('с name значение уходит в форму', async () => {
    render(<form data-testid="form">{select({ name: 'city', defaultValue: 'msk' })}</form>)
    const form = screen.getByTestId('form') as HTMLFormElement
    expect(new FormData(form).get('city')).toBe('msk')
    await userEvent.click(combobox())
    await userEvent.click(option('Мурманск'))
    expect(new FormData(form).get('city')).toBe('mur')
  })

  it('управляемый режим: показывает то, что дал родитель', async () => {
    const onValueChange = vi.fn()
    render(select({ value: 'msk', onValueChange }))
    await userEvent.click(combobox())
    await userEvent.click(option('Мурманск'))
    expect(onValueChange).toHaveBeenCalledWith('mur')
    expect(combobox()).toHaveTextContent('Москва')
  })

  it('disabled: не открывается', async () => {
    render(select({ disabled: true }))
    await userEvent.click(combobox())
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('ошибка поля доходит до селекта', () => {
    render(
      <Field label="Город" error="Выберите город">
        <Select>
          <SelectOption value="a">А</SelectOption>
        </Select>
      </Field>,
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Выберите город')
  })

  it('доступность: закрытый и открытый', async () => {
    render(select({ defaultValue: 'msk' }))
    await expectNoA11yViolations()
    await userEvent.click(combobox())
    await expectNoA11yViolations()
  })
})
