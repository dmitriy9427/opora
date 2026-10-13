import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { layerCount } from '../../primitives/layers'
import { expectNoA11yViolations } from '../../test/a11y'
import { Button } from '../button/button'
import { Field, Input } from '../field/field'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu/menu'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './dialog'

function Example(props: Partial<React.ComponentProps<typeof DialogContent>> & { onOpenChange?: (open: boolean) => void }) {
  const { onOpenChange, ...content } = props
  return (
    <>
      <button>До</button>
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button>Открыть</Button>
        </DialogTrigger>
        <DialogContent
          title="Новый проект"
          description="Название можно изменить позже"
          footer={
            <>
              <DialogClose asChild>
                <Button>Отмена</Button>
              </DialogClose>
              <Button variant="primary">Создать</Button>
            </>
          }
          {...content}
        >
          <Field label="Название">
            <Input />
          </Field>
        </DialogContent>
      </Dialog>
      <button>После</button>
    </>
  )
}

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Открыть' }))
  return screen.getByRole('dialog')
}

describe('Dialog', () => {
  it('закрыт — в DOM его нет; кнопка объявляет, что открывает диалог', () => {
    render(<Example />)
    expect(screen.queryByRole('dialog')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Открыть' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('открыт: модальный, с названием и описанием', async () => {
    render(<Example />)
    const dialog = await open()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Новый проект')
    expect(dialog).toHaveAccessibleDescription('Название можно изменить позже')
  })

  it('фокус уходит внутрь — на первый элемент', async () => {
    render(<Example />)
    await open()
    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus()
  })

  it('data-autofocus выбирает, куда поставить фокус', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent title="Поиск">
          <input aria-label="Запрос" data-autofocus />
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole('textbox', { name: 'Запрос' })).toHaveFocus()
  })

  it('Tab ходит по кругу внутри окна и не выходит наружу', async () => {
    render(<Example />)
    await open()
    const inside = [
      screen.getByRole('button', { name: 'Закрыть' }),
      screen.getByRole('textbox'),
      screen.getByRole('button', { name: 'Отмена' }),
      screen.getByRole('button', { name: 'Создать' }),
    ]
    for (const element of [...inside.slice(1), inside[0]!]) {
      await userEvent.tab()
      expect(element).toHaveFocus()
    }
    await userEvent.tab({ shift: true })
    expect(inside[3]).toHaveFocus() // с первого — на последний
  })

  it('страница под окном недоступна (inert) и не прокручивается', async () => {
    const { container } = render(<Example />)
    await open()
    expect(container).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(container).not.toHaveAttribute('inert'))
    expect(document.body.style.overflow).toBe('')
  })

  it('Escape закрывает и возвращает фокус на кнопку', async () => {
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)
    await open()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Открыть' })).toHaveFocus()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('фокус возвращается ПОСЛЕ того, как страница снова доступна', async () => {
    // jsdom не запрещает фокус на inert-элементе, а браузер — запрещает: проверяем порядок явно.
    const { container } = render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Открыть' })
    await userEvent.click(trigger)
    let inertAtFocus: boolean | null = null
    vi.spyOn(trigger, 'focus').mockImplementation(() => {
      inertAtFocus = container.hasAttribute('inert')
    })
    await userEvent.keyboard('{Escape}')
    expect(inertAtFocus).toBe(false)
  })

  it('закрывается крестиком, кнопкой DialogClose и кликом по затемнению', async () => {
    render(<Example />)
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await open()
    await userEvent.click(document.querySelector('.op-dialog__backdrop')!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('клик внутри окна его не закрывает', async () => {
    render(<Example />)
    const dialog = await open()
    await userEvent.click(dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('alertdialog не закрывается кликом мимо — нужен явный ответ', async () => {
    render(<Example role="alertdialog" />)
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }))
    await userEvent.click(document.querySelector('.op-dialog__backdrop')!)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('управляемый режим', async () => {
    function Controlled() {
      const [isOpen, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Снаружи</button>
          <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent title="Окно" />
          </Dialog>
        </>
      )
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('button', { name: 'Снаружи' }))
    expect(screen.getByRole('dialog', { name: 'Окно' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('меню внутри диалога: Escape закрывает только меню, второй — диалог', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent title="Настройки">
          <Menu>
            <MenuTrigger>Ещё</MenuTrigger>
            <MenuContent>
              <MenuItem>Пункт</MenuItem>
            </MenuContent>
          </Menu>
        </DialogContent>
      </Dialog>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }))
    expect(screen.getByRole('menuitem', { name: 'Пункт' })).toHaveFocus() // ловушка фокуса не мешает слою выше
    expect(layerCount()).toBe(2)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(layerCount()).toBe(0)
  })

  it('доступность открытого окна', async () => {
    render(<Example />)
    await open()
    await expectNoA11yViolations()
  })
})
