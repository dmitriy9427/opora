import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { expectNoA11yViolations } from '../../test/a11y'
import { Button } from './button'

describe('Button', () => {
  it('по умолчанию type="button" — не отправляет форму случайно', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('вариант и размер — в data-атрибутах, свой класс добавляется к библиотечному', () => {
    render(
      <Button variant="primary" size="lg" className="mine">
        Ок
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveClass('op-button', 'mine')
    expect(button).toHaveAttribute('data-variant', 'primary')
    expect(button).toHaveAttribute('data-size', 'lg')
  })

  it('loading: остаётся в фокусе, объявляет занятость и не выполняет нажатие', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Сохранить' })
    await userEvent.tab()
    expect(button).toHaveFocus() // disabled убрал бы кнопку из обхода
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Enter}')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disabled: не нажимается и пропускается при обходе', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Нельзя
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    await userEvent.tab()
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).not.toHaveFocus()
  })

  it('asChild: ссылка с видом кнопки, без вложенного <button>', () => {
    render(
      <Button asChild variant="primary">
        <a href="/docs">Документация</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Документация' })
    expect(link).toHaveClass('op-button')
    expect(link).toHaveAttribute('data-variant', 'primary')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('доступность: с текстом и со значком', async () => {
    render(
      <>
        <Button>Текст</Button>
        <Button iconOnly aria-label="Удалить">
          <svg aria-hidden />
        </Button>
        <Button loading>Идёт</Button>
      </>,
    )
    await expectNoA11yViolations()
  })
})
