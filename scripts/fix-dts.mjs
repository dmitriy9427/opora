/**
 * Дописать «.js» к относительным импортам в файлах типов (.d.ts).
 *
 * В исходниках импорты без расширения: `from './button'` — так привычно, и
 * сборщик (Vite) их понимает. Но компилятор переносит их в .d.ts как есть, а
 * проекты с настройкой TypeScript `moduleResolution: node16 / nodenext` требуют
 * расширение — как и сам Node для ES-модулей. Без этого у таких пользователей
 * типы библиотеки не найдутся (это ловит `attw` в npm run check:package).
 *
 * Заодно из типов убираются импорты стилей (`import './button.styles.css'`):
 * компилятор переносит и их, но в типах они бессмысленны, а файлов таких в dist нет.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const files = (dir) =>
  readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)]))

let fixed = 0
for (const file of files('dist').filter((name) => name.endsWith('.d.ts'))) {
  const source = readFileSync(file, 'utf8').replace(/^import\s+['"][^'"]+\.css['"];?\n/gm, '')
  const original = readFileSync(file, 'utf8')
  // from './x' | from "../y" | import('./z') — только относительные пути без расширения.
  const result = source.replace(/((?:from|import)\s*\(?\s*['"])(\.{1,2}\/[^'"]+?)(['"])/g, (match, before, path, after) => {
    if (/\.(js|css|json)$/.test(path)) return match
    const target = resolve(dirname(file), path)
    // Папка с index.d.ts или обычный файл?
    const suffix = existsSync(`${target}.d.ts`) ? '.js' : existsSync(join(target, 'index.d.ts')) ? '/index.js' : null
    if (!suffix) return match
    fixed++
    return `${before}${path}${suffix}${after}`
  })
  if (result !== original) writeFileSync(file, result)
}
console.log(`Типы: дописано расширений — ${fixed}`)
