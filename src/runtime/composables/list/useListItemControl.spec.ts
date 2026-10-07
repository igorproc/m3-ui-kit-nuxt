import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { useListItemControl } from './useListItemControl'
import type { ListItemControlProps } from './useListItemControl'

const control = (overrides: Partial<ListItemControlProps> = {}, attrs: Record<string, unknown> = {}, semantic = false) => {
  const props = reactive<ListItemControlProps>({ tag: 'div', interactive: false, disabled: false, ...overrides })
  return { props, ...useListItemControl({ props, attrs: () => attrs, semantic: () => semantic }) }
}

describe('useListItemControl', () => {
  it('hands out attributes only: no class and no data-*', () => {
    for (const overrides of [{}, { interactive: true, selected: true }, { tag: 'a', disabled: true }, { tag: 'button', selected: false }]) {
      const keys = Object.keys(control(overrides, {}, true).rowAttrs.value)

      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toEqual([])
    }
  })

  it('makes a static row the li of a semantic list and wraps an interactive one', () => {
    const plain = control({}, {}, true)
    expect(plain.tag.value).toBe('li')
    expect(plain.wrapped.value).toBe(false)

    const action = control({ tag: 'button' }, {}, true)
    expect(action.tag.value).toBe('button')
    expect(action.wrapped.value).toBe(true)
  })

  it('leaves the element alone outside a semantic list', () => {
    const { tag, wrapped } = control({ tag: 'button' })

    expect(tag.value).toBe('button')
    expect(wrapped.value).toBe(false)
  })

  it('makes a native button row type="button", whatever the consumer passed', () => {
    expect(control({ tag: 'button' }).rowAttrs.value.type).toBe('button')
    expect(control({ tag: 'button' }, { type: 'submit' }).rowAttrs.value.type).toBe('button')
    expect(control({ interactive: true }).rowAttrs.value.type).toBeUndefined()
  })

  it('lets the consumer attributes win, except href on a disabled link', () => {
    const option = control({ interactive: true }, { role: 'option', tabindex: -1 })
    expect(option.rowAttrs.value.role).toBe('option')
    expect(option.rowAttrs.value.tabindex).toBe(-1)

    const link = control({ tag: 'a', disabled: true }, { href: '/inbox' })
    expect(link.rowAttrs.value.href).toBeUndefined()
    expect(link.rowAttrs.value['aria-disabled']).toBe('true')
  })

  it('follows a state change', () => {
    const { props, rowAttrs } = control({ tag: 'button', selected: false })
    expect(rowAttrs.value['aria-pressed']).toBe('false')

    props.selected = true
    props.disabled = true
    expect(rowAttrs.value['aria-pressed']).toBe('true')
    expect(rowAttrs.value.disabled).toBe(true)
  })
})
