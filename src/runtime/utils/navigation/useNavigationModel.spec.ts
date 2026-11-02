import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { useNavigationModel } from './useNavigationModel'

interface Destination { id: string }

/** Runs the composable inside a component setup, where `useId()` has an instance. */
async function setup(initialItems: Destination[], initialModel: string | null) {
  const items = ref(initialItems)
  const model = ref<string | null>(initialModel)
  let api!: ReturnType<typeof useNavigationModel>

  await mountSuspended(defineComponent({
    setup() {
      api = useNavigationModel(() => items.value, model as Ref<string | null>)
      return () => h('div')
    },
  }))

  return { items, model, api }
}

describe('useNavigationModel', () => {
  it('selects the destination the model names', async () => {
    const { api } = await setup([{ id: 'a' }, { id: 'b' }], 'b')

    expect(api.selectedValue.value).toBe('b')
  })

  it('writes a selection back to the model', async () => {
    const { api, model } = await setup([{ id: 'a' }, { id: 'b' }], 'a')

    api.select('b')
    await nextTick()

    expect(model.value).toBe('b')
  })

  it('selects the bound destination once it arrives', async () => {
    const { api, items } = await setup([], 'b')

    items.value = [{ id: 'a' }, { id: 'b' }]
    await nextTick()

    expect(api.selectedValue.value).toBe('b')
  })

  it('selects nothing for an empty model and follows a cleared one', async () => {
    const { api, model } = await setup([{ id: 'a' }], null)
    expect(api.selectedValue.value).toBeNull()

    model.value = 'a'
    await nextTick()
    expect(api.selectedValue.value).toBe('a')

    model.value = null
    await nextTick()
    expect(api.selectedValue.value).toBeNull()
  })

  it('ignores an id no destination has', async () => {
    const { api, model } = await setup([{ id: 'a' }], 'a')

    api.select('missing')
    await nextTick()

    expect(model.value).toBe('a')
  })
})
