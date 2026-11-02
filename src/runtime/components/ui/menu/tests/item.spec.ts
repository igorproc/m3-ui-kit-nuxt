import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import MMenuItem from '../item/index.vue'
import MMenuGroup from '../group/index.vue'
import { useOverlayHost } from '../../overlay/tests/helpers'
import { menuItems, mountMenu, openMenu, surface } from './helpers'

useOverlayHost()

const items = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-menu__surface .ui-menu__item'))

describe('m-menu-item · variants', () => {
  it('renders the label, supporting text, shortcut and icons in their parts', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, {
      label: 'Copy',
      supportingText: 'To the clipboard',
      trailingText: 'Ctrl+C',
      leadingIcon: 'ic:outline-content-copy',
      trailingIcon: 'ic:outline-chevron-right',
    }))

    const [item] = items()
    expect(item!.querySelector('.ui-menu__item-text')!.textContent?.trim()).toBe('Copy')
    expect(item!.querySelector('.ui-menu__item-supporting')!.textContent?.trim()).toBe('To the clipboard')
    expect(item!.querySelector('.ui-menu__item-shortcut')!.textContent?.trim()).toBe('Ctrl+C')
    expect(item!.querySelector('.ui-menu__item-leading')).not.toBeNull()
    expect(item!.querySelector('.ui-menu__item-trailing')).not.toBeNull()
    expect(item!.classList).toContain('ui-menu__item--two-line')
  })

  it('prefers the default slot over the label', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Copy' }, () => h('b', 'Copy all')))

    expect(items()[0]!.querySelector('.ui-menu__item-text b')).not.toBeNull()
  })

  it.each([
    [{}, 'BUTTON'],
    [{ href: '/docs' }, 'A'],
  ] as const)('%o renders a <%s>', async (props, tag) => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Docs', ...props }))

    expect(items()[0]!.tagName).toBe(tag)
  })

  // A checked item is marked by a check, not by colour alone.
  it('shows a check in place of the icon on a checked item', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Grid', role: 'menuitemcheckbox', selected: true, leadingIcon: 'ic:outline-grid-on' }))

    expect(items()[0]!.classList).toContain('ui-menu__item--selected')
    expect(items()[0]!.innerHTML).toContain('check')
  })

  it('draws a group label and divides groups', async () => {
    await mountMenu({ modelValue: true }, () => [
      h(MMenuGroup, { label: 'Sort by' }, () => [h(MMenuItem, { label: 'Name' })]),
      h(MMenuGroup, () => [h(MMenuItem, { label: 'Delete' })]),
    ])

    const groups = surface()!.querySelectorAll('.ui-menu__group')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.querySelector('.ui-menu__group-label')!.textContent?.trim()).toBe('Sort by')
    expect(groups[1]!.querySelector('.ui-menu__group-label')).toBeNull()
  })
})

describe('m-menu-item · interaction', () => {
  it('emits select on activation', async () => {
    const picked: string[] = []
    const { open } = await mountMenu({}, () => h(MMenuItem, { label: 'Copy', onSelect: () => picked.push('copy') }))
    await openMenu(open)

    menuItems()[0]!.click()

    expect(picked).toEqual(['copy'])
  })

  it('does nothing while disabled, and stays in the arrow order', async () => {
    const picked: string[] = []
    const { open } = await mountMenu({}, () => [
      h(MMenuItem, { label: 'Copy' }),
      h(MMenuItem, { label: 'Cut', disabled: true, onSelect: () => picked.push('cut') }),
    ])
    await openMenu(open)

    menuItems()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(menuItems()[1])

    menuItems()[1]!.click()
    expect(picked).toEqual([])
  })

  it('is found by typeahead by its label', async () => {
    const { open } = await mountMenu({}, () => [h(MMenuItem, { label: 'Copy' }), h(MMenuItem, { label: 'Paste' })])
    await openMenu(open)

    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))

    expect(document.activeElement).toBe(menuItems()[1])
  })
})

describe('m-menu-item · a11y', () => {
  it.each(['menuitem', 'menuitemcheckbox', 'menuitemradio'] as const)('renders the %s role', async (role) => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Item', role }))

    expect(items()[0]!.getAttribute('role')).toBe(role)
  })

  it.each([
    ['menuitem', false, null],
    ['menuitemcheckbox', true, 'true'],
    ['menuitemcheckbox', false, 'false'],
    ['menuitemradio', true, 'true'],
  ] as const)('a %s (selected %s) carries aria-checked %o', async (role, selected, checked) => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Item', role, selected }))

    expect(items()[0]!.getAttribute('aria-checked')).toBe(checked)
  })

  it('marks a disabled item aria-disabled, never natively disabled', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Cut', disabled: true }))

    expect(items()[0]!.getAttribute('aria-disabled')).toBe('true')
    expect(items()[0]!.hasAttribute('disabled')).toBe(false)
  })

  it('hides the icons from assistive tech', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuItem, { label: 'Copy', leadingIcon: 'ic:outline-content-copy' }))

    expect(items()[0]!.querySelector('.ui-menu__item-leading')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('names a group by its label', async () => {
    await mountMenu({ modelValue: true }, () => h(MMenuGroup, { label: 'Sort by' }, () => [h(MMenuItem, { label: 'Name', role: 'menuitemradio' })]))

    const group = surface()!.querySelector('[role="group"]')!
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent?.trim()).toBe('Sort by')
  })
})
