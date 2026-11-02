import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createRegistry } from './createRegistry'
import { createModel } from './createModel'
import { createSelection } from './createSelection'
import { createGroup } from './createGroup'
import { createSingle } from './createSingle'

const FACTORIES = {
  createRegistry: () => createRegistry(),
  createModel: () => createModel(),
  createSelection: () => createSelection(),
  createGroup: () => createGroup(),
  createSingle: () => createSingle(),
}

describe('ticket ids for registrations that name none', () => {
  for (const [name, create] of Object.entries(FACTORIES)) {
    it(`${name}: two registrations outside a component get two distinct tickets`, () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const registry = create()

      const first = registry.register({ value: 'a' })
      const second = registry.register({ value: 'b' })

      expect(registry.size).toBe(2)
      expect(first.id).not.toBe(second.id)
      expect(first.id).not.toBe('')
      expect(second.value).toBe('b')
      warn.mockRestore()
    })
  }

  it('keeps setup-time ids SSR-stable and gives later registrations their own', async () => {
    let registry!: ReturnType<typeof createSingle>
    const ids: unknown[] = []

    const Host = defineComponent({
      setup() {
        registry = createSingle()
        ids.push(registry.register({ value: 'setup' }).id)
        onMounted(() => {
          ids.push(registry.register({ value: 'mounted' }).id)
        })
        return () => h('div')
      },
    })

    await mountSuspended(Host)
    await nextTick()
    ids.push(registry.register({ value: 'late-1' }).id)
    ids.push(registry.register({ value: 'late-2' }).id)

    expect(ids[0]).toMatch(/^v-/)
    expect(new Set(ids).size).toBe(4)
    expect(registry.size).toBe(4)
  })

  it('an explicit id is always kept', () => {
    const registry = createSelection()
    expect(registry.register({ id: 'given' }).id).toBe('given')
  })
})
