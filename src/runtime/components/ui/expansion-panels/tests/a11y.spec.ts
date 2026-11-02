import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import { group } from './helpers'
import type { Model } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(component: ReturnType<typeof group>) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panels · a11y', () => {
  it('adds no role of its own — the panels carry the accordion semantics', async () => {
    const wrapper = await mount(group())

    expect(wrapper.find('.ui-expansion-panels').attributes('role')).toBeUndefined()
  })

  it('gives every panel its own button and region ids', async () => {
    const wrapper = await mount(group())
    const controls = wrapper.findAll('.ui-expansion-panel__header').map(header => header.attributes('aria-controls'))
    const regions = wrapper.findAll('[role="region"]').map(region => region.attributes('id'))

    expect(new Set(controls).size).toBe(3)
    expect(controls).toEqual(regions)
  })

  it('says the open panel of a mandatory group cannot collapse, with aria-disabled', async () => {
    const wrapper = await mount(group({ mandatory: ref(true), model: ref<Model>('a') }))
    const headers = wrapper.findAll('.ui-expansion-panel__header')

    expect(headers.map(header => header.attributes('aria-disabled'))).toEqual(['true', undefined, undefined])

    await headers[1]!.trigger('click')

    expect(headers.map(header => header.attributes('aria-disabled'))).toEqual([undefined, 'true', undefined])
  })

  it('keeps the locked header in the tab order — it is aria-disabled, not disabled', async () => {
    const wrapper = await mount(group({ mandatory: ref(true), model: ref<Model>('a') }))

    expect(wrapper.find('.ui-expansion-panel__header').attributes('disabled')).toBeUndefined()
  })

  it('keeps only the closed panels of a group inert', async () => {
    const wrapper = await mount(group({ multiple: ref(true), model: ref<Model>(['b']) }))
    const regions = wrapper.findAll('[role="region"]')

    expect(regions.map(region => region.attributes('inert') !== undefined)).toEqual([true, false, true])
  })
})
