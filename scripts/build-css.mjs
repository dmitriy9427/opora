/**
 * Стили по частям: dist/css/base.css и по файлу на компонент.
 *
 * Обычно стили подключают целиком — `opora-ui/styles.css`, 7,5 КБ в сжатом виде.
 * Тем, кому важен каждый килобайт, нужна возможность взять только своё:
 *
 *   import 'opora-ui/css/base.css'      // слои, токены, темы — обязательно и первым
 *   import 'opora-ui/css/button.css'
 *   import 'opora-ui/css/dialog.css'
 *
 * Файл компонента самодостаточен: если компонент использует другой (кнопка в
 * состоянии loading показывает Spinner), стили того уже внутри.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

/** Чьи стили нужны компоненту, кроме своих. */
const DEPENDS = {
  button: ['spinner'],
  radio: ['field'], // подпись ошибки и звёздочка «обязательное» — классы поля
}

const source = (name) => readFileSync(`src/components/${name}/${name}.styles.css`, 'utf8')

mkdirSync('dist/css', { recursive: true })
writeFileSync('dist/css/base.css', readFileSync('src/styles/tokens.css', 'utf8'))

const names = readdirSync('src/components')
const rows = []
for (const name of names) {
  const css = [...(DEPENDS[name] ?? []), name].map(source).join('\n')
  writeFileSync(`dist/css/${name}.css`, css)
  rows.push([name, gzipSync(css).length])
}

const kb = (bytes) => (bytes / 1024).toFixed(2)
console.log(
  `Стили по частям: base.css (${kb(gzipSync(readFileSync('dist/css/base.css')).length)} КБ) + ${names.length} компонентов (${rows.map(([name, size]) => `${name} ${kb(size)}`).join(', ')})`,
)
