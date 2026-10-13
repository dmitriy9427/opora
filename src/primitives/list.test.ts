import { renderHook } from '@testing-library/react'

import { nextIndex, useTypeahead } from './list'

describe('nextIndex', () => {
  const h = { orientation: 'horizontal' as const }
  const v = { orientation: 'vertical' as const }

  it('горизонтально — стрелки влево и вправо, вертикально — вверх и вниз', () => {
    expect(nextIndex('ArrowRight', 0, 3, h)).toBe(1)
    expect(nextIndex('ArrowLeft', 1, 3, h)).toBe(0)
    expect(nextIndex('ArrowDown', 0, 3, v)).toBe(1)
    expect(nextIndex('ArrowDown', 0, 3, h)).toBeNull()
  })

  it('по умолчанию ходит по кругу', () => {
    expect(nextIndex('ArrowRight', 2, 3, h)).toBe(0)
    expect(nextIndex('ArrowLeft', 0, 3, h)).toBe(2)
  })

  it('без loop останавливается на краях', () => {
    expect(nextIndex('ArrowRight', 2, 3, { ...h, loop: false })).toBe(2)
    expect(nextIndex('ArrowLeft', 0, 3, { ...h, loop: false })).toBe(0)
  })

  it('Home и End ведут в начало и конец', () => {
    expect(nextIndex('Home', 2, 5, v)).toBe(0)
    expect(nextIndex('End', 0, 5, v)).toBe(4)
  })

  it('ничего не выбрано: вперёд — первый, назад — последний', () => {
    expect(nextIndex('ArrowDown', -1, 4, v)).toBe(0)
    expect(nextIndex('ArrowUp', -1, 4, v)).toBe(3)
  })

  it('посторонние клавиши и пустой набор — null', () => {
    expect(nextIndex('a', 0, 3, h)).toBeNull()
    expect(nextIndex('ArrowRight', 0, 0, h)).toBeNull()
  })
})

describe('useTypeahead', () => {
  const cities = ['Москва', 'Мурманск', 'Казань', 'Минск']
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('находит по первой букве без учёта регистра', () => {
    const { result } = renderHook(() => useTypeahead())
    expect(result.current('к', cities, -1)).toBe(2)
  })

  it('копит буквы, набранные подряд', () => {
    const { result } = renderHook(() => useTypeahead())
    expect(result.current('м', cities, -1)).toBe(0)
    expect(result.current('у', cities, 0)).toBe(1) // «му» → Мурманск
  })

  it('после паузы начинает заново', () => {
    const { result } = renderHook(() => useTypeahead())
    result.current('м', cities, -1)
    vi.advanceTimersByTime(600)
    expect(result.current('к', cities, 0)).toBe(2)
  })

  it('повтор одной буквы перебирает совпадения по кругу', () => {
    const { result } = renderHook(() => useTypeahead())
    expect(result.current('м', cities, -1)).toBe(0)
    expect(result.current('м', cities, 0)).toBe(1)
    expect(result.current('м', cities, 1)).toBe(3)
    expect(result.current('м', cities, 3)).toBe(0)
  })

  it('служебные клавиши и пробел в начале — не поиск', () => {
    const { result } = renderHook(() => useTypeahead())
    expect(result.current('Enter', cities, 0)).toBe(-1)
    expect(result.current(' ', cities, 0)).toBe(-1)
  })

  it('нет совпадений — −1', () => {
    const { result } = renderHook(() => useTypeahead())
    expect(result.current('я', cities, 0)).toBe(-1)
  })
})
