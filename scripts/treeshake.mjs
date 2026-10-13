/**
 * Проверка tree-shaking: «взял одну кнопку — получил одну кнопку».
 *
 * Собираем три крошечных «приложения» настоящим сборщиком (Vite) и смотрим,
 * сколько кода библиотеки попало в каждое. Если кто-то добавит в модуль
 * побочное действие или общий импорт «всего сразу», сборщик перестанет
 * выбрасывать неиспользуемое — и эта проверка упадёт.
 *
 * React в расчёт не входит (он внешний): считаем только код библиотеки.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

import { build } from 'vite'

const root = resolve(import.meta.dirname, '..')
const CASES = [
  { name: 'только Button', code: `import { Button } from 'opora-ui'; console.log(Button)`, limit: 1_100 },
  {
    name: 'Button + Field + Input + Checkbox',
    code: `import { Button, Field, Input, Checkbox } from 'opora-ui'; console.log(Button, Field, Input, Checkbox)`,
    limit: 1_900,
  },
  {
    name: 'только Dialog',
    code: `import { Dialog, DialogContent, DialogTrigger } from 'opora-ui'; console.log(Dialog, DialogContent, DialogTrigger)`,
    limit: 3_500,
  },
  { name: 'вся библиотека', code: `import * as ui from 'opora-ui'; console.log(ui)`, limit: 11_500 },
]

const dir = mkdtempSync(join(tmpdir(), 'opora-shake-'))
let failed = false
try {
  for (const test of CASES) {
    const entry = join(dir, 'entry.js')
    writeFileSync(entry, test.code)
    const result = await build({
      root: dir,
      configFile: false,
      logLevel: 'silent',
      resolve: { alias: { 'opora-ui': join(root, 'dist/index.js') } },
      build: { write: false, minify: true, rollupOptions: { input: entry, external: [/^react(-dom)?(\/.*)?$/] } },
    })
    const output = Array.isArray(result) ? result[0].output : result.output
    const size = gzipSync(
      output
        .filter((chunk) => chunk.type === 'chunk')
        .map((chunk) => chunk.code)
        .join(''),
    ).length
    const ok = size <= test.limit
    failed ||= !ok
    console.log(`${ok ? '✓' : '✗'} ${test.name}: ${(size / 1024).toFixed(1)} КБ gzip (предел ${(test.limit / 1024).toFixed(1)})`)
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
if (failed) {
  console.error('\nВ сборку попало больше кода, чем должно: проверьте побочные действия модулей и поле sideEffects.')
  process.exit(1)
}
