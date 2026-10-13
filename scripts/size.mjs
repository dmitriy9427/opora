/**
 * Размер пакета — с бюджетом.
 *
 * Библиотека попадает в сборку каждого приложения, которое её использует:
 * каждый лишний килобайт платят все пользователи всех этих приложений. Бюджет
 * не даёт размеру расти незаметно — превышение роняет проверку (npm run check).
 *
 * Считаем gzip: так файлы идут по сети.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

/** Бюджеты, байты gzip. */
const BUDGET = { js: 24_000, css: 8_500 }

const files = (dir) =>
  readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)]))
const gzip = (file) => gzipSync(readFileSync(file)).length
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} КБ`

const all = files('dist')
const js = all.filter((file) => file.endsWith('.js'))
const rows = js.map((file) => [file.replace('dist/', ''), gzip(file)]).sort((a, b) => b[1] - a[1])

console.log('Самые тяжёлые модули (gzip):')
for (const [file, size] of rows.slice(0, 6)) console.log(`  ${kb(size).padStart(8)}  ${file}`)

// Весь JavaScript одним куском — так он окажется в сборке приложения, которое использует все компоненты.
// (Сумма по отдельным файлам завышала бы размер: общий код сжимается лучше.)
const total = { js: gzipSync(Buffer.concat(js.map((file) => readFileSync(file)))).length, css: gzip('dist/styles.css') }
let failed = false
for (const [kind, size] of Object.entries(total)) {
  const over = size > BUDGET[kind]
  failed ||= over
  console.log(`${over ? '✗' : '✓'} ${kind.toUpperCase()}: ${kb(size)} из ${kb(BUDGET[kind])}`)
}
if (failed) {
  console.error('\nПревышен бюджет размера. Уменьшите пакет или осознанно поднимите бюджет в scripts/size.mjs.')
  process.exit(1)
}
