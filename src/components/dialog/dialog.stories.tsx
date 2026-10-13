import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '../button/button'
import { Field, Input } from '../field/field'
import { Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger } from '../menu/menu'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../popover/popover'
import { Select, SelectOption } from '../select/select'
import { toast } from '../toast/toast'
import { Tooltip } from '../tooltip/tooltip'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './dialog'

const meta = {
  title: 'Компоненты/Всплывающие',
  component: Dialog,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Dialog>
export default meta
type Story = StoryObj

/**
 * Откройте и нажимайте Tab: фокус ходит по кругу внутри окна. Escape закрывает и
 * возвращает фокус на кнопку. Внутри — селект: его Escape закрывает только список.
 */
export const DialogStory: Story = {
  name: 'Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Новый проект</Button>
      </DialogTrigger>
      <DialogContent
        title="Новый проект"
        description="Название и регион можно изменить позже."
        footer={
          <>
            <DialogClose asChild>
              <Button>Отмена</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast.success('Проект создан')}>
                Создать
              </Button>
            </DialogClose>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Field label="Название">
            <Input data-autofocus placeholder="Мой проект" />
          </Field>
          <Field label="Регион">
            <Select defaultValue="msk">
              <SelectOption value="msk">Москва</SelectOption>
              <SelectOption value="spb">Санкт-Петербург</SelectOption>
              <SelectOption value="nsk">Новосибирск</SelectOption>
            </Select>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  ),
}

/** `role="alertdialog"` — нужен явный ответ: клик по затемнению окно не закрывает. */
export const AlertDialogStory: Story = {
  name: 'Dialog: подтверждение',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Удалить проект</Button>
      </DialogTrigger>
      <DialogContent
        role="alertdialog"
        size="sm"
        title="Удалить проект «Опора»?"
        description="Все файлы и история будут удалены без возможности восстановления."
        hideClose
        footer={
          <>
            <DialogClose asChild>
              {/* Фокус по умолчанию — на безопасном действии. */}
              <Button data-autofocus>Не удалять</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="danger"
                onClick={() =>
                  toast('Проект удалён', { action: { label: 'Вернуть', onClick: () => toast.success('Проект восстановлен') } })
                }
              >
                Удалить
              </Button>
            </DialogClose>
          </>
        }
      />
    </Dialog>
  ),
}

/** На кнопке: ↓ открывает с первого пункта, ↑ — с последнего. В меню: стрелки, буквы, Enter, Escape. */
export const MenuStory: Story = {
  name: 'Menu',
  render: function Render() {
    const [grid, setGrid] = useState(true)
    const [rulers, setRulers] = useState(false)
    return (
      <Menu>
        <MenuTrigger asChild>
          <Button>Действия</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem shortcut="F2" onSelect={() => toast('Переименование')}>
            Переименовать
          </MenuItem>
          <MenuItem onSelect={() => toast('Копия создана')}>Дублировать</MenuItem>
          <MenuItem disabled>Переместить</MenuItem>
          <MenuSeparator />
          <MenuGroup label="Вид">
            <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Сетка
            </MenuCheckboxItem>
            <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers}>
              Линейки
            </MenuCheckboxItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem danger shortcut="⌫" onSelect={() => toast.error('Удалено')}>
            Удалить
          </MenuItem>
        </MenuContent>
      </Menu>
    )
  },
}

/** Немодальная панель: страница остаётся доступной, клик мимо закрывает. */
export const PopoverStory: Story = {
  name: 'Popover',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Фильтры</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Фильтры" style={{ width: '16rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Field label="Цена от">
            <Input size="sm" inputMode="numeric" placeholder="0" />
          </Field>
          <Field label="Цена до">
            <Input size="sm" inputMode="numeric" placeholder="10 000" />
          </Field>
          <PopoverClose asChild>
            <Button variant="primary" size="sm">
              Применить
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

/** Появляется при наведении (с задержкой) и при фокусе с клавиатуры (сразу). Escape скрывает. */
export const TooltipStory: Story = {
  name: 'Tooltip',
  render: () => (
    <div className="sb-row">
      <Tooltip content="Сохранить изменения">
        <Button>Наведите</Button>
      </Tooltip>
      <Tooltip content="Подсказка снизу" placement="bottom">
        <Button>Снизу</Button>
      </Tooltip>
      <Tooltip content="Удалить навсегда">
        <Button iconOnly aria-label="Удалить">
          ×
        </Button>
      </Tooltip>
    </div>
  ),
}

/** Наведите курсор на уведомление — таймер остановится. Ошибка объявляется скринридером сразу. */
export const ToastStory: Story = {
  name: 'Toast',
  render: () => (
    <div className="sb-row">
      <Button onClick={() => toast('Черновик сохранён')}>Обычный</Button>
      <Button onClick={() => toast.success('Оплата прошла', { description: 'Чек отправлен на почту' })}>Успех</Button>
      <Button onClick={() => toast.warning('Заканчивается место', { description: 'Осталось 200 МБ' })}>Предупреждение</Button>
      <Button
        onClick={() =>
          toast.error('Не удалось сохранить', {
            description: 'Проверьте соединение',
            action: { label: 'Повторить', onClick: () => toast.success('Сохранено') },
          })
        }
      >
        Ошибка с действием
      </Button>
      <Button
        onClick={() => {
          toast('Загружаем файл…', { id: 'upload', duration: Infinity })
          setTimeout(() => toast.success('Файл загружен', { id: 'upload' }), 1800)
        }}
      >
        Обновление по id
      </Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>
        Закрыть все
      </Button>
    </div>
  ),
}
