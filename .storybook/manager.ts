import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

// Оформление самой оболочки Storybook: название и ссылка вместо логотипа по умолчанию.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Опора — компоненты React',
    brandUrl: 'https://github.com/dmitriy9427/opora',
    colorPrimary: '#4f46e5',
    colorSecondary: '#4f46e5',
  }),
})
