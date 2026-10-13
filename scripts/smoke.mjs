/**
 * Проверка пакета «глазами пользователя».
 *
 * Тесты проверяют исходники. Но пользователь получает не исходники, а архив из
 * npm — и между ними много мест, где можно ошибиться: поле "files" не включило
 * нужное, карта "exports" указывает на несуществующий файл, типы не находятся,
 * модуль падает при серверном рендеринге. Здесь пакет упаковывается (npm pack),
 * распаковывается во временное «приложение» и используется тремя способами:
 *
 *   1. TypeScript со строгой настройкой moduleResolution: nodenext видит типы;
 *   2. Node загружает ES-модуль и рендерит компоненты на сервере (SSR);
 *   3. файл стилей находится по адресу 'opora-ui/styles.css'.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

// 1. Упаковать — ровно то, что ушло бы в npm.
const [{ filename, files }] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts']))
const tarball = join(root, filename)
console.log(`Архив: ${filename}, файлов: ${files.length}`)

const app = mkdtempSync(join(tmpdir(), 'opora-smoke-'))
try {
  // 2. «Установить»: распаковать архив в node_modules временного приложения.
  const target = join(app, 'node_modules', 'opora-ui')
  mkdirSync(target, { recursive: true })
  run('tar', ['-xzf', tarball, '-C', target, '--strip-components=1'])
  // React — общий с репозиторием (peer-зависимость: её даёт приложение).
  for (const name of ['react', 'react-dom', '@types/react', '@types/react-dom', 'csstype']) {
    const from = join(root, 'node_modules', name)
    const to = join(app, 'node_modules', name)
    mkdirSync(join(to, '..'), { recursive: true })
    if (existsSync(from)) symlinkSync(from, to)
  }
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke', private: true, type: 'module' }))

  // 3. Типы: строгий TypeScript с разрешением модулей «как в Node».
  writeFileSync(
    join(app, 'app.tsx'),
    `import { Button, Dialog, DialogContent, DialogTrigger, Field, Input, Select, SelectOption, Tabs, toast, type ButtonProps } from 'opora-ui'
const props: ButtonProps = { variant: 'primary', size: 'lg' }
// @ts-expect-error — несуществующий вариант должен быть ошибкой типов
const wrong: ButtonProps = { variant: 'rainbow' }
export const App = () => (
  <Dialog>
    <DialogTrigger asChild><Button {...props}>Открыть</Button></DialogTrigger>
    <DialogContent title="Окно">
      <Field label="Город"><Select onValueChange={(value: string) => toast(value)}><SelectOption value="a">А</SelectOption></Select></Field>
      <Field label="Имя"><Input /></Field>
      <Tabs defaultValue="a" />
    </DialogContent>
  </Dialog>
)
void wrong
`,
  )
  writeFileSync(
    join(app, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'nodenext',
        moduleResolution: 'nodenext',
        target: 'es2023',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
      },
      include: ['app.tsx'],
    }),
  )
  run(join(root, 'node_modules', '.bin', 'tsc'), ['-p', app])
  console.log('✓ типы находятся при moduleResolution: nodenext')

  // 4. Загрузка в Node и серверный рендеринг.
  writeFileSync(
    join(app, 'ssr.mjs'),
    `import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import * as ui from 'opora-ui'
const html = renderToString(h('div', null,
  h(ui.Button, { variant: 'primary' }, 'Кнопка'),
  h(ui.Field, { label: 'Почта', error: 'Ошибка' }, h(ui.Input)),
  h(ui.Tabs, { defaultValue: 'a' }, h(ui.TabList, null, h(ui.Tab, { value: 'a' }, 'А')), h(ui.TabPanel, { value: 'a' }, 'панель')),
  h(ui.Dialog, { defaultOpen: true }, h(ui.DialogContent, { title: 'Окно' })),
  h(ui.Toaster),
))
if (!html.includes('op-button') || !html.includes('role="tab"')) throw new Error('SSR: в разметке нет компонентов')
// Порталы (диалог, тосты) на сервере не рисуются — и не должны ронять рендер.
if (html.includes('op-dialog')) throw new Error('SSR: портал отрисован на сервере')
console.log(Object.keys(ui).length)
`,
  )
  const exported = run('node', ['ssr.mjs'], app).trim()
  console.log(`✓ ES-модуль загружается в Node, серверный рендеринг работает (экспортов: ${exported})`)

  // 5. Стили и лишнее в архиве.
  const css = readFileSync(join(target, 'dist', 'styles.css'), 'utf8')
  if (!css.includes('@layer opora.tokens') || !css.includes('.op-button')) throw new Error('styles.css: нет слоёв или компонентов')
  run('node', ['-e', "import.meta.resolve('opora-ui/styles.css')", '--input-type=module'], app)
  console.log(`✓ стили: 'opora-ui/styles.css', ${(css.length / 1024).toFixed(1)} КБ`)

  const stray = files.map((file) => file.path).filter((path) => /\.(test|stories)\.|^src\/|\.storybook/.test(path))
  if (stray.length) throw new Error(`В архив попало лишнее: ${stray.join(', ')}`)
  console.log('✓ в архиве нет тестов, историй и исходников')
} finally {
  rmSync(app, { recursive: true, force: true })
  rmSync(tarball, { force: true })
}
