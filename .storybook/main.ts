import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  // Список «Get started» в боковой панели — для тех, кто впервые ставит Storybook; в демо он лишний.
  features: { sidebarOnboardingChecklist: false },
  // Сборка библиотеки (lib mode из vite.config.ts) Storybook не нужна: он собирает обычный сайт.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    build: { ...viteConfig.build, lib: undefined, rollupOptions: undefined, minify: true, cssCodeSplit: true },
  }),
}

export default config
