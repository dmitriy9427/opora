import { computePosition } from './position'

const viewport = { width: 1000, height: 800 }
const floating = { width: 200, height: 100 }
const at = (x: number, y: number) => ({ x, y, width: 100, height: 40 })

describe('computePosition', () => {
  it('ставит под якорем по левому краю с зазором', () => {
    expect(computePosition({ anchor: at(300, 200), floating, viewport, placement: 'bottom-start', offset: 8 })).toMatchObject({
      x: 300,
      y: 248,
      side: 'bottom',
    })
  })

  it('выравнивает по центру и по концу', () => {
    expect(computePosition({ anchor: at(300, 200), floating, viewport, placement: 'bottom' }).x).toBe(250)
    expect(computePosition({ anchor: at(300, 200), floating, viewport, placement: 'bottom-end' }).x).toBe(200)
  })

  it('ставит сбоку', () => {
    expect(computePosition({ anchor: at(300, 200), floating, viewport, placement: 'right', offset: 8 })).toMatchObject({
      x: 408,
      y: 170,
      side: 'right',
    })
    expect(computePosition({ anchor: at(300, 200), floating, viewport, placement: 'left', offset: 8 })).toMatchObject({
      x: 92,
      side: 'left',
    })
  })

  it('flip: снизу не помещается — переворачивает наверх', () => {
    const result = computePosition({ anchor: at(300, 740), floating, viewport, placement: 'bottom-start', offset: 8 })
    expect(result).toMatchObject({ side: 'top', y: 740 - 100 - 8 })
  })

  it('flip: не переворачивает, если на другой стороне ещё теснее', () => {
    const tall = { width: 200, height: 600 }
    expect(computePosition({ anchor: at(300, 300), floating: tall, viewport, placement: 'bottom' }).side).toBe('bottom')
  })

  it('shift: не даёт вылезти за правый и левый край', () => {
    expect(computePosition({ anchor: at(950, 200), floating, viewport, placement: 'bottom-start', padding: 8 }).x).toBe(1000 - 200 - 8)
    expect(computePosition({ anchor: at(-40, 200), floating, viewport, placement: 'bottom-end', padding: 8 }).x).toBe(8)
  })

  it('shift для боковых сторон работает по вертикали', () => {
    expect(computePosition({ anchor: at(300, 780), floating, viewport, placement: 'right', padding: 8 }).y).toBe(800 - 100 - 8)
  })

  it('сообщает, сколько места есть в выбранную сторону', () => {
    // Якорь у самого низа: вверх — 700, вниз — 60. Список высотой 400 встанет сверху.
    const result = computePosition({
      anchor: at(300, 700),
      floating: { width: 200, height: 400 },
      viewport,
      placement: 'bottom',
      offset: 4,
      padding: 8,
    })
    expect(result.side).toBe('top')
    expect(result.available).toBe(700 - 4 - 8)
  })

  it('элемент шире экрана прижимается к началу, а не уезжает влево', () => {
    expect(computePosition({ anchor: at(300, 200), floating: { width: 1200, height: 100 }, viewport, placement: 'bottom' }).x).toBe(8)
  })
})
