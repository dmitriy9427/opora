import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { composeHandlers, composeRefs, cx, useControllableState } from './compose'
import { Slot } from './slot'

describe('cx', () => {
  it('склеивает классы и пропускает пустое', () => {
    expect(cx('a', false, undefined, null, '', 'b')).toBe('a b')
    expect(cx(false, undefined)).toBeUndefined()
  })
})

describe('composeRefs', () => {
  it('раздаёт узел объектным и функциональным ref и очищает их', () => {
    const object = createRef<HTMLDivElement>()
    const fn = vi.fn()
    const { unmount } = render(<div ref={composeRefs(object, fn, undefined)} data-testid="x" />)
    expect(object.current).toBe(screen.getByTestId('x'))
    expect(fn).toHaveBeenCalledWith(screen.getByTestId('x'))
    unmount()
    expect(object.current).toBeNull()
    expect(fn).toHaveBeenLastCalledWith(null)
  })
})

describe('composeHandlers', () => {
  it('вызывает оба обработчика; пользовательский может отменить наш', () => {
    const ours = vi.fn()
    composeHandlers(undefined, ours)({ defaultPrevented: false })
    expect(ours).toHaveBeenCalledTimes(1)
    composeHandlers((event: { defaultPrevented: boolean }) => (event.defaultPrevented = true), ours)({ defaultPrevented: false })
    expect(ours).toHaveBeenCalledTimes(1)
  })
})

describe('useControllableState', () => {
  it('неуправляемый режим: хранит значение сам и сообщает об изменении', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ value: undefined, defaultValue: 'a', onChange }))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('управляемый режим: значение меняет только родитель', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useControllableState({ value, defaultValue: 'x', onChange }), {
      initialProps: { value: 'a' },
    })
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('a') // родитель не обновил — значение прежнее
    expect(onChange).toHaveBeenCalledWith('b')
    rerender({ value: 'b' })
    expect(result.current[0]).toBe('b')
  })
})

describe('Slot (asChild)', () => {
  it('передаёт ребёнку классы, атрибуты и ref, не создавая своего тега', () => {
    const ref = createRef<HTMLElement>()
    const { container } = render(
      <Slot className="op-button" data-size="md" ref={ref}>
        <a href="/docs" className="link">
          Документация
        </a>
      </Slot>,
    )
    const link = screen.getByRole('link', { name: 'Документация' })
    expect(container.children).toHaveLength(1)
    expect(link).toHaveClass('op-button', 'link')
    expect(link).toHaveAttribute('data-size', 'md')
    expect(ref.current).toBe(link)
  })

  it('вызывает оба обработчика: сначала ребёнка, потом свой', async () => {
    const order: string[] = []
    render(
      <Slot onClick={() => order.push('slot')}>
        <button onClick={() => order.push('child')}>ок</button>
      </Slot>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(order).toEqual(['child', 'slot'])
  })

  it('ребёнок может отменить поведение слота', async () => {
    const slot = vi.fn()
    render(
      <Slot onClick={slot}>
        <button onClick={(event) => event.preventDefault()}>ок</button>
      </Slot>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(slot).not.toHaveBeenCalled()
  })
})
