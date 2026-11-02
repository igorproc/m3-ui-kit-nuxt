import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import type { DOMWrapper } from '@vue/test-utils'
import MAutocomplete from '../index.vue'

interface City { id: number, name: string, off?: boolean }

const items: City[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta', off: true },
  { id: 3, name: 'Gamma' },
]

const messages = { clear: 'Clear selection', toggle: 'Toggle options', loading: 'Loading options', empty: 'No options', noResults: 'No results' }
const base = { items, itemTitle: 'name', itemValue: 'id', itemDisabled: 'off', messages } as const

let host: HTMLElement
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>, attach = false) {
  if (current) current.unmount()
  current = await mountSuspended(MAutocomplete, { props, ...(attach ? { attachTo: document.body } : {}) })
  return current as Awaited<ReturnType<typeof mountSuspended>>
}

beforeEach(() => {
  host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  current?.unmount()
  current = null
  host.remove()
})

const optionEls = () => [...document.querySelectorAll<HTMLElement>('.ui-dropdown-panel__option')]
const optionByText = (text: string) => optionEls().find(option => option.textContent?.includes(text))

async function openMenu(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
  await nextTick()
}

describe('m-autocomplete · remote and IME', () => {
  async function mountWith(props: Record<string, unknown>, slots: Record<string, unknown> = {}) {
    if (current) current.unmount()
    current = await mountSuspended(MAutocomplete, { props, slots })
    return current as Awaited<ReturnType<typeof mountSuspended>>
  }

  // A parent that searches on the server: it hears the query and starts loading.
  function mountRemote(startLoading: (loading: Ref<boolean>) => void) {
    const loading = ref(false)
    const Remote = defineComponent({
      setup: () => () => h(MAutocomplete, {
        'items': [],
        'loading': loading.value,
        'messages': { toggle: 'Toggle options', loading: 'Loading options' },
        'onUpdate:search': () => startLoading(loading),
      }),
    })
    return mountSuspended(Remote).then((wrapper) => {
      current = wrapper
      return wrapper
    })
  }

  // B6.3a: below the minimum the hint is what the panel has to say.
  it('shows the hint while the query is still too short', async () => {
    const wrapper = await mountWith({ ...base, minSearchLength: 3 }, { hint: ({ missing }: { missing: number }) => `Type ${missing} more` })

    await wrapper.find('input.ui-text-field__input').setValue('a')
    await nextTick()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    expect(document.body.textContent).toContain('Type 2 more')
  })

  // B6.3b: the parent's loading arrives with its next render, after the keystroke.
  it('opens on the first keystroke of a remote search', async () => {
    const wrapper = await mountRemote((loading) => {
      loading.value = true
    })

    await wrapper.find('input.ui-text-field__input').setValue('g')
    await nextTick()

    expect(document.querySelector('[role="progressbar"]')).not.toBeNull()
  })

  it('opens once a remote search starts loading after a pause', async () => {
    const wrapper = await mountRemote((loading) => {
      setTimeout(() => {
        loading.value = true
      }, 0)
    })

    await wrapper.find('input.ui-text-field__input').trigger('focus')
    await wrapper.find('input.ui-text-field__input').setValue('g')
    await new Promise(resolve => setTimeout(resolve, 10))
    await nextTick()

    expect(document.querySelector('[role="progressbar"]')).not.toBeNull()
  })

  // B6.3c: a server that found nothing for a query has no results, not no options.
  it('says no results for a typed query the server answered with nothing', async () => {
    const wrapper = await mountWith({ ...base, items: [], filter: false })

    await wrapper.find('input.ui-text-field__input').setValue('zzz')
    await nextTick()

    expect(document.body.textContent).toContain('No results')
    expect(document.body.textContent).not.toContain('No options')
  })

  it('says no options while nothing was typed', async () => {
    const wrapper = await mountWith({ ...base, items: [], filter: false })
    await openMenu(wrapper)

    expect(document.body.textContent).toContain('No options')
  })

  // modern-web ime-safe-enter-submit: Safari sends the IME's confirming Enter
  // after compositionend, flagged only by keyCode 229.
  it.each([
    ['isComposing', { isComposing: true }],
    ['keyCode 229', { keyCode: 229 }],
  ])('leaves an Enter of an IME to the IME (%s)', async (_, flags) => {
    const wrapper = await mountWith(base)
    const input = wrapper.find('input.ui-text-field__input')
    await input.setValue('ga')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(input.attributes('aria-activedescendant')).toBeTruthy()

    input.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...flags }))
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  // Chromium sends the last input of a composition before compositionend.
  it('opens the panel once a composition ends', async () => {
    const wrapper = await mountWith(base)
    const input = wrapper.find('input.ui-text-field__input')
    const element = input.element as HTMLInputElement

    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    element.value = 'ga'
    element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
    await nextTick()
    expect(wrapper.emitted('update:open')).toBeFalsy()

    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ga' }))
    await nextTick()
    await nextTick()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    expect(optionByText('Gamma')).toBeTruthy()
  })

  // Audit: a value given before its items showed its id until the field was left.
  it('shows the title once the items arrive for a value given before them', async () => {
    const wrapper = await mountWith({ ...base, items: [], modelValue: 3 })

    await wrapper.setProps({ items })

    expect((wrapper.find('input.ui-text-field__input').element as HTMLInputElement).value).toBe('Gamma')
  })
})
