import type { HTMLAttributes } from 'react'

import { cx } from './compose'

/**
 * Текст, который не виден, но читается скринридером.
 * Например, «(откроется в новой вкладке)» у ссылки или название столбца с одними значками.
 */
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('op-visually-hidden', className)} {...props} />
}
