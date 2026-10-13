import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { expectNoA11yViolations } from '../../test/a11y'
import { Button } from '../button/button'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../popover/popover'
import { Tooltip } from '../tooltip/tooltip'
import { Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger } from './menu'

function Example({ onRename = () => {}, onDelete = () => {} }: { onRename?: () => void; onDelete?: () => void }) {
  const [grid, setGrid] = useState(false)
  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button>Действия</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={onRename}>Переименовать</MenuItem>
          <MenuItem disabled>Переместить</MenuItem>
          <MenuItem>Дублировать</MenuItem>
          <MenuSeparator />
          <MenuGroup label="Вид">
            <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Сетка
            </MenuCheckboxItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem danger onSelect={onDelete}>
            Удалить
          </MenuItem>
        </MenuContent>
      </Menu>
      <button>Дальше</button>
    </>
  )
}

const trigger = () => screen.getByRole('button', { name: 'Действия' })
const item = (name: string) => screen.getByRole('menuitem', { name })

describe('Menu', () => {
  it('кнопка объявляет меню; клик открывает и ставит фокус на первый пункт', async () => {
    render(<Example />)
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Действия' })).toBeInTheDocument()
    expect(item('Переименовать')).toHaveFocus()
  })

  it('с клавиатуры: ↓ открывает с первого пункта, ↑ — с последнего', async () => {
    render(<Example />)
    trigger().focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(item('Переименовать')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard('{ArrowUp}')
    expect(item('Удалить')).toHaveFocus()
  })

  it('стрелки ходят по кругу и пропускают выключенный пункт; Home и End', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.keyboard('{ArrowDown}')
    expect(item('Дублировать')).toHaveFocus() // «Переместить» выключен
    await userEvent.keyboard('{End}')
    expect(item('Удалить')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(item('Переименовать')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(item('Удалить')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(item('Переименовать')).toHaveFocus()
  })

  it('поиск по первым буквам', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.keyboard('у')
    expect(item('Удалить')).toHaveFocus()
    await userEvent.keyboard('д')
    expect(item('Удалить')).toHaveFocus() // «уд» — всё ещё «Удалить»
  })

  it('Enter выбирает пункт, закрывает меню и возвращает фокус на кнопку', async () => {
    const onRename = vi.fn()
    render(<Example onRename={onRename} />)
    await userEvent.click(trigger())
    await userEvent.keyboard('{Enter}')
    expect(onRename).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger()).toHaveFocus()
  })

  it('клик по пункту выбирает; выключенный пункт не выбирается', async () => {
    const onDelete = vi.fn()
    render(<Example onDelete={onDelete} />)
    await userEvent.click(trigger())
    await userEvent.click(item('Переместить'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(item('Удалить'))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('пункт-флажок переключается и не закрывает меню', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Сетка' })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(checkbox)
    expect(screen.getByRole('menuitemcheckbox', { name: 'Сетка' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('Escape закрывает и возвращает фокус; клик мимо — закрывает', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger()).toHaveFocus()

    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('button', { name: 'Дальше' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('Tab закрывает меню', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.tab()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('повторный клик по кнопке закрывает меню, а не открывает заново', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.click(trigger())
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('наведение мыши переносит фокус на пункт', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await userEvent.hover(item('Дублировать'))
    expect(item('Дублировать')).toHaveFocus()
  })

  it('доступность открытого меню', async () => {
    render(<Example />)
    await userEvent.click(trigger())
    await expectNoA11yViolations()
  })
})

describe('Popover', () => {
  const popover = (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Фильтры</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Фильтры">
          <input aria-label="Город" />
          <PopoverClose>Готово</PopoverClose>
        </PopoverContent>
      </Popover>
      <button>Снаружи</button>
    </>
  )

  it('открывается по клику, фокус уходит внутрь; страница остаётся доступной', async () => {
    const { container } = render(popover)
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    const dialog = screen.getByRole('dialog', { name: 'Фильтры' })
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(screen.getByRole('textbox', { name: 'Город' })).toHaveFocus()
    expect(container).not.toHaveAttribute('inert')
  })

  it('Escape и кнопка «Готово» закрывают и возвращают фокус на кнопку', async () => {
    render(popover)
    const trigger = screen.getByRole('button', { name: 'Фильтры' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()

    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Готово' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('клик мимо закрывает и НЕ отбирает фокус у того, куда кликнули', async () => {
    render(popover)
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    await userEvent.click(screen.getByRole('button', { name: 'Снаружи' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Снаружи' })).toHaveFocus()
  })

  it('повторный клик по кнопке закрывает', async () => {
    render(popover)
    const trigger = screen.getByRole('button', { name: 'Фильтры' })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(trigger)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('доступность', async () => {
    render(popover)
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    await expectNoA11yViolations()
  })
})

describe('Tooltip', () => {
  const tooltip = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) => (
    <Tooltip content="Удалить навсегда" delay={0} {...props}>
      <Button iconOnly aria-label="Удалить">
        ×
      </Button>
    </Tooltip>
  )

  it('появляется при наведении и описывает кнопку', async () => {
    render(tooltip())
    expect(screen.queryByRole('tooltip')).toBeNull()
    await userEvent.hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Удалить навсегда')
    expect(screen.getByRole('button', { name: 'Удалить' })).toHaveAccessibleDescription('Удалить навсегда')
  })

  it('исчезает, когда курсор ушёл', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(tooltip())
    await user.hover(screen.getByRole('button'))
    await user.unhover(screen.getByRole('button'))
    vi.advanceTimersByTime(150)
    await vi.waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    vi.useRealTimers()
  })

  it('Escape скрывает подсказку, фокус остаётся на кнопке', async () => {
    render(tooltip())
    await userEvent.hover(screen.getByRole('button'))
    screen.getByRole('button').focus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  it('нажатие скрывает подсказку', async () => {
    render(tooltip())
    await userEvent.hover(screen.getByRole('button'))
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('по наведению появляется с задержкой', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(tooltip({ delay: 400 }))
    await user.hover(screen.getByRole('button'))
    vi.advanceTimersByTime(300)
    expect(screen.queryByRole('tooltip')).toBeNull()
    vi.advanceTimersByTime(150)
    await vi.waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
    vi.useRealTimers()
  })

  it('disabled — не показывается; обработчики ребёнка сохраняются', async () => {
    const onPointerEnter = vi.fn()
    render(
      <Tooltip content="x" disabled delay={0}>
        <button onPointerEnter={onPointerEnter}>ок</button>
      </Tooltip>,
    )
    await userEvent.hover(screen.getByRole('button'))
    expect(onPointerEnter).toHaveBeenCalled()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('доступность', async () => {
    render(tooltip())
    await userEvent.hover(screen.getByRole('button'))
    await expectNoA11yViolations()
  })
})

describe('Tooltip вокруг кнопки меню', () => {
  it('оба получают элемент: подсказка показывается, меню открывается и позиционируется по кнопке', async () => {
    render(
      <Menu>
        <Tooltip content="Ещё действия" delay={0}>
          <MenuTrigger asChild>
            <Button iconOnly aria-label="Действия">
              …
            </Button>
          </MenuTrigger>
        </Tooltip>
        <MenuContent>
          <MenuItem>Пункт</MenuItem>
        </MenuContent>
      </Menu>,
    )
    const trigger = screen.getByRole('button', { name: 'Действия' })
    await userEvent.hover(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Ещё действия')

    await userEvent.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'Пункт' })).toHaveFocus()
    expect(screen.queryByRole('tooltip')).toBeNull() // нажали — подсказка ушла

    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveFocus() // меню знает свою кнопку, несмотря на ref подсказки
  })
})
