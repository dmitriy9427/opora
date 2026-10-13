import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Field,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Select,
  SelectOption,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  toast,
} from '..'

const meta = { title: 'Примеры/Настройки команды', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta
export default meta

type Member = { id: number; name: string; email: string; role: string }
const INITIAL: Member[] = [
  { id: 1, name: 'Алина Морозова', email: 'alina@example.com', role: 'admin' },
  { id: 2, name: 'Тимур Гареев', email: 'timur@example.com', role: 'editor' },
  { id: 3, name: 'Вера Соколова', email: 'vera@example.com', role: 'viewer' },
]
const ROLES: Record<string, string> = { admin: 'Администратор', editor: 'Редактор', viewer: 'Наблюдатель' }

/** Все компоненты вместе — как в настоящем экране. Пройдите его целиком с клавиатуры. */
export const TeamSettings: StoryObj = {
  name: 'Экран целиком',
  render: function Render() {
    const [members, setMembers] = useState(INITIAL)
    const [inviteOpen, setInviteOpen] = useState(false)

    const remove = (member: Member) => {
      setMembers((list) => list.filter((m) => m.id !== member.id))
      // Опасное действие обратимо: «Вернуть» в уведомлении лучше, чем вопрос «Вы уверены?».
      toast(`${member.name} удалён из команды`, {
        action: { label: 'Вернуть', onClick: () => setMembers((list) => [...list, member].sort((a, b) => a.id - b.id)) },
      })
    }

    return (
      <div style={{ maxWidth: '44rem', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Команда</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--op-text-muted)', fontSize: '0.875rem' }}>
              Участники и настройки рабочего пространства
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="primary">Пригласить</Button>
            </DialogTrigger>
            <DialogContent title="Пригласить участника" description="Отправим письмо со ссылкой для входа.">
              <form
                style={{ display: 'grid', gap: '1rem' }}
                onSubmit={(event) => {
                  event.preventDefault()
                  const data = new FormData(event.currentTarget)
                  const email = String(data.get('email'))
                  setMembers((list) => [...list, { id: Date.now(), name: email.split('@')[0]!, email, role: String(data.get('role')) }])
                  setInviteOpen(false)
                  toast.success('Приглашение отправлено', { description: email })
                }}
              >
                <Field label="Почта" required>
                  <Input name="email" type="email" required data-autofocus placeholder="name@example.com" />
                </Field>
                <Field label="Роль">
                  <Select name="role" defaultValue="editor">
                    {Object.entries(ROLES).map(([value, label]) => (
                      <SelectOption key={value} value={value}>
                        {label}
                      </SelectOption>
                    ))}
                  </Select>
                </Field>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <DialogClose asChild>
                    <Button>Отмена</Button>
                  </DialogClose>
                  <Button type="submit" variant="primary">
                    Отправить
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs defaultValue="members">
          <TabList aria-label="Разделы">
            <Tab value="members">Участники</Tab>
            <Tab value="notifications">Уведомления</Tab>
          </TabList>

          <TabPanel value="members">
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                border: '1px solid var(--op-border)',
                borderRadius: 'var(--op-radius-lg)',
              }}
            >
              {members.map((member, i) => (
                <li
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderTop: i ? '1px solid var(--op-border)' : undefined,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{member.name}</div>
                    <div style={{ color: 'var(--op-text-muted)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.email}
                    </div>
                  </div>
                  <Badge tone={member.role === 'admin' ? 'accent' : 'neutral'}>{ROLES[member.role]}</Badge>
                  <Menu>
                    <Tooltip content="Действия">
                      <MenuTrigger asChild>
                        <Button variant="ghost" iconOnly aria-label={`Действия: ${member.name}`}>
                          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                            <circle cx="3" cy="8" r="1.4" />
                            <circle cx="8" cy="8" r="1.4" />
                            <circle cx="13" cy="8" r="1.4" />
                          </svg>
                        </Button>
                      </MenuTrigger>
                    </Tooltip>
                    <MenuContent placement="bottom-end">
                      {Object.entries(ROLES).map(([value, label]) => (
                        <MenuItem
                          key={value}
                          disabled={member.role === value}
                          onSelect={() => setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, role: value } : m)))}
                        >
                          Сделать: {label.toLowerCase()}
                        </MenuItem>
                      ))}
                      <MenuSeparator />
                      <MenuItem danger onSelect={() => remove(member)}>
                        Удалить из команды
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </li>
              ))}
            </ul>
          </TabPanel>

          <TabPanel value="notifications">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <Switch defaultChecked>Письмо о новом участнике</Switch>
              <Switch>Еженедельная сводка</Switch>
              <Checkbox defaultChecked>Присылать копию администраторам</Checkbox>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    )
  },
}
