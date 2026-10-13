import type { Preview } from '@storybook/react-vite'

import '../src/styles/tokens.css'
import './preview.css'
import { Toaster } from '../src'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: {
      storySort: { order: ['Опора', ['Введение', 'Темы и стили'], 'Компоненты', 'Примеры'] },
    },
    // Вкладка Accessibility: нарушения показываются как ошибки, а не предупреждения.
    a11y: { test: 'error' },
  },
  globalTypes: {
    theme: {
      description: 'Тема',
      toolbar: {
        title: 'Тема',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Светлая', icon: 'sun' },
          { value: 'dark', title: 'Тёмная', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      // Тема библиотеки — атрибут data-theme на любом предке; ставим на <html>, чтобы перекрасились и порталы.
      document.documentElement.dataset.theme = context.globals.theme as string
      return (
        <>
          <Story />
          <Toaster />
        </>
      )
    },
  ],
  tags: ['autodocs'],
}

export default preview
