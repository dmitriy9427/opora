import { readFileSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { peerDependencies: Record<string, string> }

/**
 * Сборка БИБЛИОТЕКИ, а не приложения. Отличия:
 *
 *   - React не попадает в сборку (external): его даёт приложение. Иначе на странице
 *     оказалось бы два React — и хуки перестали бы работать.
 *   - Код не склеивается в один файл (preserveModules): каждый компонент — свой модуль,
 *     и сборщик приложения выбросит неиспользуемые (tree-shaking).
 *   - Код не минифицируется: это сделает приложение, а читаемый код в node_modules
 *     помогает отлаживать.
 *   - Стили собираются в один файл dist/styles.css — приложение подключает его один раз.
 *   - Только ES-модули: CommonJS-версии нет. React 19 и все современные сборщики работают с ESM.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'] },
    minify: false,
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      // react, react-dom и их подпути (react/jsx-runtime, react-dom/client).
      external: (id) => Object.keys(pkg.peerDependencies).some((name) => id === name || id.startsWith(`${name}/`)),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'styles[extname]',
        // Директива для Next.js (App Router): компоненты используют хуки и события, значит они клиентские.
        // С ней библиотеку можно импортировать прямо из серверного компонента — без своей обёртки.
        banner: "'use client';",
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
