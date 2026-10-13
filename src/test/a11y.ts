/**
 * Автоматическая проверка доступности (axe-core).
 *
 * axe находит то, что можно проверить по разметке: нет подписи у поля, неверная
 * роль, ссылка aria на несуществующий id, вложенные интерактивные элементы.
 * Это примерно треть возможных проблем. Клавиатуру и порядок фокуса он не
 * проверяет — для них написаны отдельные тесты.
 */
import axe from 'axe-core'

export async function expectNoA11yViolations(container: Element = document.body) {
  const results = await axe.run(container, {
    rules: {
      // jsdom не считает стили — контраст в нём проверить нельзя (это делает Storybook в браузере).
      'color-contrast': { enabled: false },
      // Фрагмент компонента — не целая страница: требования «один <main>», «есть <h1>» к нему не относятся.
      region: { enabled: false },
    },
  })
  const violations = results.violations.map(
    (violation) => `${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.html).join('\n  ')}`,
  )
  expect(violations).toEqual([])
}
