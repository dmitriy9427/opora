import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// После каждого теста — убрать отрисованное и то, что компоненты оставили на <body>.
afterEach(() => {
  cleanup()
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
})

// jsdom не умеет раскладку: этих методов в нём нет, а компоненты их вызывают.
Element.prototype.scrollIntoView ??= () => {}
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
