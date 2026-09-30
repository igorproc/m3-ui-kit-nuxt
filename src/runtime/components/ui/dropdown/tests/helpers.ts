import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MDropdown from '../index.vue'

export interface City { id: number, name: string, off?: boolean }

export const cities: City[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta', off: true },
  { id: 3, name: 'Gamma' },
]

/** Titles and values resolved by key — the shape most consumers have. */
export const base = { items: cities, itemTitle: 'name', itemValue: 'id', itemDisabled: 'off' } as const

export type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

let current: Wrapper | null = null
let host: HTMLElement | null = null

/**
 * `attach` puts the wrapper in the document: jsdom fires no focus event for a
 * detached node, so any test that reads `document.activeElement` needs it.
 */
export async function mount(props: Record<string, unknown>, attach = false): Promise<Wrapper> {
  current?.unmount()
  current = await mountSuspended(MDropdown, {
    props,
    ...(attach ? { attachTo: document.body } : {}),
  }) as Wrapper
  return current
}

/** The menu teleports into the app-level overlay host, which tests must supply. */
export function createHost() {
  host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
}

export function destroyHost() {
  current?.unmount()
  current = null
  host?.remove()
  host = null
}

export const input = (wrapper: Wrapper) => wrapper.find('input.ui-text-field__input')
export const options = () => [...document.querySelectorAll<HTMLElement>('.ui-dropdown__option')]
export const optionByText = (text: string) => options().find(option => option.textContent?.includes(text))
// Chips live in the field itself, not in the teleported panel.
export const chips = (wrapper: Wrapper) => wrapper.findAll('.ui-dropdown__chip')

export async function open(wrapper: Wrapper) {
  await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
  await nextTick()
}

export async function press(wrapper: Wrapper, key: string) {
  await input(wrapper).trigger('keydown', { key })
  await nextTick()
}
