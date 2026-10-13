/**
 * Slot — приём «asChild»: отдать своё поведение чужому элементу.
 *
 *   <Button asChild><a href="/docs">Документация</a></Button>
 *
 * Без asChild кнопка рисует <button>. С asChild она НЕ рисует свой тег, а
 * передаёт классы, обработчики и ref единственному ребёнку. Получается
 * настоящая ссылка с видом кнопки — без <button><a></a></button> (так нельзя:
 * интерактивный элемент внутри интерактивного).
 *
 * Тот же приём у триггеров: <DialogTrigger asChild><Button>…</Button></DialogTrigger>.
 */
import { cloneElement, isValidElement, type HTMLAttributes, type ReactNode, type Ref } from 'react'

import { composeRefs, cx } from './compose'

type AnyProps = Record<string, unknown>

/** Склеить пропсы родителя (slot) и ребёнка: обработчики вызываются оба, классы и стили объединяются. */
export function mergeProps(slot: AnyProps, child: AnyProps): AnyProps {
  const merged: AnyProps = { ...slot, ...child }
  for (const key of Object.keys(slot)) {
    const ours = slot[key]
    const theirs = child[key]
    if (/^on[A-Z]/.test(key) && typeof ours === 'function' && typeof theirs === 'function') {
      // Сначала обработчик ребёнка: он ближе к пользователю и может отменить наш.
      merged[key] = (...args: unknown[]) => {
        theirs(...args)
        const event = args[0] as { defaultPrevented?: boolean } | undefined
        if (!event?.defaultPrevented) ours(...args)
      }
    } else if (key === 'className') {
      merged[key] = cx(ours as string, theirs as string)
    } else if (key === 'style') {
      merged[key] = { ...(ours as object), ...(theirs as object) }
    }
  }
  return merged
}

export function Slot({ children, ref, ...props }: HTMLAttributes<HTMLElement> & { children?: ReactNode; ref?: Ref<HTMLElement> }) {
  if (!isValidElement(children)) {
    // process.env.NODE_ENV — договорённость экосистемы: сборщик приложения подставит значение,
    // и в продакшен-сборке эта ветка исчезнет целиком.
    if (process.env.NODE_ENV !== 'production') console.error('[opora] asChild ждёт ровно один React-элемент в children')
    return null
  }
  const child = children as React.ReactElement<AnyProps & { ref?: Ref<HTMLElement> }>
  return cloneElement(child, {
    ...mergeProps(props as AnyProps, child.props),
    // В React 19 ref — обычный проп: достаём его у ребёнка и объединяем со своим.
    ref: composeRefs(ref, child.props.ref),
  })
}
