# 02. Пакет: как код становится `npm install`

## `package.json` библиотеки

```json
{
  "name": "opora-ui",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }
}
```

Каждое поле — ответ на вопрос «что получит пользователь».

### `exports` — двери в пакет

Карта: какой импорт какому файлу соответствует.

```ts
import { Button } from 'opora-ui'      // "."            → dist/index.js (типы — dist/index.d.ts)
import 'opora-ui/styles.css'           // "./styles.css" → dist/styles.css
```

Чего в карте нет — импортировать **нельзя**: `import 'opora-ui/dist/primitives/layers.js'`
упадёт. Это защита: внутренние файлы можно переименовывать, не ломая пользователей.
Публичный интерфейс — только то, что экспортирует `src/index.ts`.

Внутри условия `"types"` идёт **первым**: условия проверяются по порядку, и TypeScript должен
найти своё раньше `"default"`.

### `peerDependencies` — «React даёте вы»

Обычная зависимость (`dependencies`) ставится вместе с пакетом. Если бы React был там,
у приложения могло оказаться **два React**: свой и наш. Хуки хранят состояние внутри
экземпляра React — с двумя экземплярами получается знаменитая ошибка «Invalid hook call».

`peerDependencies` говорит: «мне нужен React 19, но ставить его будете вы». В сборку
библиотеки он не попадает (`external` в `vite.config.ts`).

В `devDependencies` React тоже есть — чтобы разрабатывать и тестировать саму библиотеку.

### `sideEffects` — что нельзя выбрасывать

Сборщик приложения выбрасывает неиспользуемый код (tree-shaking). Но он должен быть уверен,
что модуль ничего не делает «сам по себе» при импорте. `"sideEffects": ["**/*.css"]` говорит:
JavaScript-модули чистые — неиспользуемые можно удалять; CSS — нет, его импорт и есть действие.

Проверить просто: приложение, импортирующее только `Button`, не должно получить код `Select`.
Этому помогает и структура сборки — каждый компонент в своём файле (`preserveModules`).

### `files` — что попадёт в архив

Только `dist` (плюс `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md` — их npm кладёт
всегда). Исходники, тесты и Storybook пользователю не нужны.

### `type: module` и почему нет CommonJS

Пакет — только ES-модули. Раньше библиотеки выпускали две версии (ESM и CJS), и это
источник тонких багов («двойной пакет»). React 19, Vite, Next и современный Node работают с
ESM; `require()` ESM-пакета умеет Node 22+. Одна версия — меньше способов ошибиться.

## Сборка

```bash
npm run build     # vite build && tsc -p tsconfig.build.json && node scripts/fix-dts.mjs
```

Три шага — три результата.

### 1. Vite в режиме библиотеки → JavaScript и CSS

`vite.config.ts`:

```ts
build: {
  lib: { entry: 'src/index.ts', formats: ['es'] },
  minify: false,
  cssCodeSplit: false,
  rollupOptions: {
    external: (id) => peerDeps.some((name) => id === name || id.startsWith(`${name}/`)),
    output: { preserveModules: true, preserveModulesRoot: 'src', banner: "'use client';" },
  },
}
```

| Настройка | Зачем |
| --- | --- |
| `external` | React и его подпути (`react/jsx-runtime`) остаются импортами, а не копируются в пакет |
| `preserveModules` | каждый исходный файл → свой файл в `dist`: лучше tree-shaking, понятные пути в стеке ошибок |
| `minify: false` | минифицирует приложение; читаемый код в `node_modules` помогает отлаживать |
| `cssCodeSplit: false` | все стили → один `dist/styles.css` |
| `banner: 'use client'` | директива для Next.js: компоненты с хуками — клиентские |
| `sourcemap: true` | по ошибке в приложении видно строку в исходнике библиотеки |

Компоненты импортируют свои стили (`import './button.styles.css'`), но в собранном
JavaScript этих импортов нет: Vite выносит CSS в общий файл. Иначе пакет не загрузился бы в
Node (там нельзя импортировать `.css`) — это проверяет `npm run test:package`.

### 2. TypeScript → файлы типов

`tsconfig.build.json`: `emitDeclarationOnly` — компилятор создаёт только `.d.ts`, без
JavaScript. Тесты и истории исключены.

### 3. `fix-dts.mjs` → типы, которые находятся везде

В исходниках импорты без расширения (`from './button'`). Компилятор переносит их в `.d.ts`
как есть — а проекты с `moduleResolution: nodenext` требуют расширение. Скрипт дописывает
`.js` и убирает из типов импорты CSS. Без этого шага у части пользователей типы библиотеки
молча превращались бы в `any`. Нашёл это не я, а `attw` (ниже).

## Проверки пакета

Тесты проверяют исходники. Пользователь получает **архив** — и между ними много мест для ошибки.

### `publint`

Проверяет `package.json`: существуют ли файлы из `exports`, правильный ли порядок условий,
согласованы ли `type` и расширения.

### `attw` — Are The Types Wrong?

Упаковывает пакет и пробует найти типы при каждом способе разрешения модулей TypeScript.

```
│ node16 (from ESM) │ 🟢 (ESM) │
│ bundler           │ 🟢       │
```

### `npm run test:package` — «установить» и использовать

`scripts/smoke.mjs` делает `npm pack`, распаковывает архив в `node_modules` временного
приложения и проверяет:

1. строгий TypeScript (`moduleResolution: nodenext`) компилирует код с нашими компонентами —
   и **отклоняет** неверный проп (`@ts-expect-error` на `variant: 'rainbow'`);
2. Node загружает ES-модуль и рендерит компоненты на сервере (`renderToString`);
3. `opora-ui/styles.css` находится и содержит слои;
4. в архиве нет тестов, историй и исходников.

Это дешёвая замена «опубликовать и посмотреть, что сломалось у людей».

### Бюджет размера

`npm run size`: весь JavaScript — 21,8 КБ gzip при бюджете 23,4; CSS — 7,5 из 8,3.
Превышение роняет `npm run check`. Размер библиотеки платят пользователи всех приложений,
где она стоит, — расти незаметно он не должен.

## Серверный рендеринг

Библиотека не знает, где её запустят. Три правила:

- **`document` и `window` — только в эффектах и обработчиках**, не при рендере;
- **порталы** рисуются после монтирования (`Portal` через `useSyncExternalStore`: на сервере
  снимок `false`, в браузере `true` — без рассинхронизации гидрации);
- **`useLayoutEffect`** на сервере заменён на `useEffect` (`useIsomorphicLayoutEffect`).

И `'use client'` в каждом модуле — чтобы в Next.js App Router компоненты можно было
импортировать прямо из серверного компонента.

## `process.env.NODE_ENV`

Предупреждения для разработчика («asChild ждёт один элемент») обёрнуты в

```ts
if (process.env.NODE_ENV !== 'production') console.error(…)
```

Это договорённость экосистемы: сборщик приложения подставляет значение, и в продакшен-сборке
ветка исчезает. `import.meta.env.DEV` для библиотеки не годится — это особенность Vite, и при
сборке библиотеки он заменил бы её на `false` навсегда.
