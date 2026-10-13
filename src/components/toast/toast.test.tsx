import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { expectNoA11yViolations } from '../../test/a11y'
import { Dialog, DialogContent } from '../dialog/dialog'
import { Toaster, resetToasts, toast } from './toast'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  act(() => resetToasts())
})
afterEach(() => vi.useRealTimers())

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('toast', () => {
  it('область уведомлений есть всегда, даже пустая', () => {
    render(<Toaster />)
    expect(screen.getByRole('region', { name: 'Уведомления' })).toBeInTheDocument()
  })

  it('показывает сообщение как «живую область»; ошибку — как alert', () => {
    render(<Toaster />)
    act(() => {
      toast('Сохранено', { description: 'Изменения применены' })
      toast.error('Не удалось сохранить')
    })
    expect(screen.getByRole('status')).toHaveTextContent('СохраненоИзменения применены')
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить')
  })

  it('исчезает сам по истечении времени', () => {
    render(<Toaster />)
    act(() => void toast('Привет', { duration: 3000 }))
    advance(2900)
    expect(screen.getByText('Привет')).toBeInTheDocument()
    advance(200 + 200) // время вышло + анимация ухода
    expect(screen.queryByText('Привет')).toBeNull()
  })

  it('таймер стоит, пока на уведомлениях курсор, и продолжается с того же места', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Toaster />)
    act(() => void toast('Читаю', { duration: 3000 }))
    advance(2000)
    await user.hover(screen.getByText('Читаю'))
    advance(10_000)
    expect(screen.getByText('Читаю')).toBeInTheDocument()
    await user.unhover(screen.getByText('Читаю'))
    advance(500)
    expect(screen.getByText('Читаю')).toBeInTheDocument() // оставалась секунда
    advance(1000)
    expect(screen.queryByText('Читаю')).toBeNull()
  })

  it('duration: Infinity — висит, пока не закроют', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Toaster />)
    act(() => void toast('Важно', { duration: Infinity }))
    advance(60_000)
    expect(screen.getByText('Важно')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Закрыть уведомление' }))
    advance(300)
    expect(screen.queryByText('Важно')).toBeNull()
  })

  it('кнопка действия выполняет его и закрывает тост', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onClick = vi.fn()
    render(<Toaster />)
    act(() => void toast('Письмо удалено', { action: { label: 'Вернуть', onClick } }))
    await user.click(screen.getByRole('button', { name: 'Вернуть' }))
    expect(onClick).toHaveBeenCalledOnce()
    advance(300)
    expect(screen.queryByText('Письмо удалено')).toBeNull()
  })

  it('тот же id обновляет тост, а не создаёт второй', () => {
    render(<Toaster />)
    act(() => void toast('Загрузка…', { id: 'upload', duration: Infinity }))
    act(() => void toast.success('Загружено', { id: 'upload' }))
    expect(screen.queryByText('Загрузка…')).toBeNull()
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Загружено')
  })

  it('на экране не больше четырёх: старые закрываются', () => {
    render(<Toaster />)
    act(() => {
      for (let i = 1; i <= 6; i++) toast(`Сообщение ${i}`, { duration: Infinity })
    })
    advance(300)
    expect(screen.getAllByRole('status')).toHaveLength(4)
    expect(screen.queryByText('Сообщение 1')).toBeNull()
    expect(screen.getByText('Сообщение 6')).toBeInTheDocument()
  })

  it('toast.dismiss() без аргумента закрывает все', () => {
    render(<Toaster />)
    act(() => {
      toast('Раз', { duration: Infinity })
      toast('Два', { duration: Infinity })
    })
    act(() => toast.dismiss())
    advance(300)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('открытый диалог не делает уведомления недоступными', () => {
    render(
      <>
        <Toaster />
        <Dialog defaultOpen>
          <DialogContent title="Окно" />
        </Dialog>
      </>,
    )
    expect(screen.getByRole('region', { name: 'Уведомления', hidden: true })).not.toHaveAttribute('inert')
  })

  it('доступность', async () => {
    vi.useRealTimers()
    render(<Toaster />)
    act(() => {
      toast.success('Сохранено', { description: 'Всё хорошо', action: { label: 'Открыть', onClick: () => {} }, duration: Infinity })
      toast.error('Ошибка', { duration: Infinity })
    })
    await expectNoA11yViolations()
  })
})
