/**
 * Портал: отрисовать детей не там, где они написаны, а в конце <body>.
 *
 * Зачем: всплывающее окно внутри карточки с overflow: hidden было бы обрезано,
 * а внутри элемента с transform — позиционировалось бы относительно него.
 * В конце <body> ему ничто не мешает. При этом в дереве React оно остаётся
 * на месте: контекст и всплытие событий работают как обычно.
 */
import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const subscribe = () => () => {}

export function Portal({ children, container }: { children: ReactNode; container?: Element | null }) {
  // На сервере document нет. useSyncExternalStore с разными снимками для сервера и клиента —
  // штатный способ сказать «это есть только в браузере» без рассинхронизации при гидрации.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return mounted ? createPortal(children, container ?? document.body) : null
}
