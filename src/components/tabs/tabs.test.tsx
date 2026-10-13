import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { expectNoA11yViolations } from '../../test/a11y'
import { Accordion, AccordionItem } from '../accordion/accordion'
import { Tab, TabList, TabPanel, Tabs } from './tabs'

const tabs = (props: Partial<React.ComponentProps<typeof Tabs>> = {}) => (
  <Tabs defaultValue="a" {...props}>
    <TabList aria-label="Разделы">
      <Tab value="a">Общее</Tab>
      <Tab value="b">Доступ</Tab>
      <Tab value="c" disabled>
        Архив
      </Tab>
      <Tab value="d">Оплата</Tab>
    </TabList>
    <TabPanel value="a">Панель общего</TabPanel>
    <TabPanel value="b">Панель доступа</TabPanel>
    <TabPanel value="c">Панель архива</TabPanel>
    <TabPanel value="d">Панель оплаты</TabPanel>
  </Tabs>
)

describe('Tabs', () => {
  it('показывает панель выбранной вкладки и связывает их между собой', () => {
    render(tabs())
    const tab = screen.getByRole('tab', { name: 'Общее' })
    const panel = screen.getByRole('tabpanel', { name: 'Общее' })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveTextContent('Панель общего')
    expect(screen.queryByText('Панель доступа')).toBeNull()
  })

  it('Tab заходит в список один раз — на выбранную вкладку — и уходит в панель', async () => {
    render(tabs({ defaultValue: 'b' }))
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Доступ' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('стрелки ходят по вкладкам по кругу, пропуская выключенную, и сразу открывают', async () => {
    const onValueChange = vi.fn()
    render(tabs({ onValueChange }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Доступ' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Панель доступа')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Оплата' })).toHaveFocus() // «Архив» пропущен
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Общее' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith('d')
    await userEvent.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith('a')
  })

  it('ручная активация: стрелки двигают фокус, открывает Enter', async () => {
    render(tabs({ activation: 'manual' }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Доступ' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Панель общего')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Панель доступа')
  })

  it('вертикальные вкладки управляются стрелками вверх и вниз', async () => {
    render(tabs({ orientation: 'vertical' }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Общее' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Доступ' })).toHaveFocus()
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('keepMounted оставляет скрытые панели в DOM', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="x">
          <Tab value="a">А</Tab>
          <Tab value="b">Б</Tab>
        </TabList>
        <TabPanel value="a">раз</TabPanel>
        <TabPanel value="b" keepMounted>
          два
        </TabPanel>
      </Tabs>,
    )
    expect(screen.getByText('два')).not.toBeVisible()
  })

  it('управляемый режим', async () => {
    const onValueChange = vi.fn()
    render(tabs({ value: 'a', defaultValue: undefined, onValueChange }))
    await userEvent.click(screen.getByRole('tab', { name: 'Доступ' }))
    expect(onValueChange).toHaveBeenCalledWith('b')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Панель общего')
  })

  it('доступность', async () => {
    render(tabs())
    await expectNoA11yViolations()
  })
})

const accordion = (props: object = {}) => (
  <Accordion {...props}>
    <AccordionItem value="a" title="Доставка">
      Текст о доставке
    </AccordionItem>
    <AccordionItem value="b" title="Оплата">
      Текст об оплате
    </AccordionItem>
    <AccordionItem value="c" title="Возврат" disabled>
      Текст о возврате
    </AccordionItem>
  </Accordion>
)

describe('Accordion', () => {
  it('кнопка управляет областью: aria-expanded и aria-controls', async () => {
    render(accordion())
    const trigger = screen.getByRole('button', { name: 'Доставка' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Доставка' })).toHaveAttribute('id', trigger.getAttribute('aria-controls'))
  })

  it('закрытая секция недоступна фокусу и скринридеру (inert)', async () => {
    render(accordion())
    const panel = document.getElementById(screen.getByRole('button', { name: 'Доставка' }).getAttribute('aria-controls')!)!
    expect(panel).toHaveAttribute('inert')
    await userEvent.click(screen.getByRole('button', { name: 'Доставка' }))
    expect(panel).not.toHaveAttribute('inert')
  })

  it('single: открытие одной секции закрывает другую', async () => {
    const onValueChange = vi.fn()
    render(accordion({ onValueChange }))
    await userEvent.click(screen.getByRole('button', { name: 'Доставка' }))
    await userEvent.click(screen.getByRole('button', { name: 'Оплата' }))
    expect(screen.getByRole('button', { name: 'Доставка' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Оплата' })).toHaveAttribute('aria-expanded', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('b')
  })

  it('single: повторный клик закрывает; collapsible={false} — не даёт закрыть последнюю', async () => {
    const { unmount } = render(accordion({ defaultValue: 'a' }))
    await userEvent.click(screen.getByRole('button', { name: 'Доставка' }))
    expect(screen.getByRole('button', { name: 'Доставка' })).toHaveAttribute('aria-expanded', 'false')
    unmount()

    render(accordion({ defaultValue: 'a', collapsible: false }))
    await userEvent.click(screen.getByRole('button', { name: 'Доставка' }))
    expect(screen.getByRole('button', { name: 'Доставка' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('multiple: секции открываются независимо', async () => {
    const onValueChange = vi.fn()
    render(accordion({ type: 'multiple', onValueChange }))
    await userEvent.click(screen.getByRole('button', { name: 'Доставка' }))
    await userEvent.click(screen.getByRole('button', { name: 'Оплата' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b'])
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(2)
  })

  it('клавиатура: Enter открывает, стрелки ходят по заголовкам', async () => {
    render(accordion())
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Доставка' })).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Оплата' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Доставка' })).toHaveFocus() // выключенная пропущена, по кругу
  })

  it('заголовки секций — настоящие заголовки нужного уровня', () => {
    render(accordion({ headingLevel: 2 }))
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
  })

  it('доступность', async () => {
    render(accordion({ defaultValue: 'a' }))
    await expectNoA11yViolations()
  })
})
