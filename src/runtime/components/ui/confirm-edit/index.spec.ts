import { describe, expect, it, vi } from 'vitest'
import { effectScope, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useConfirmEditTransaction } from '#kit/composables/confirm-edit/useConfirmEditTransaction'
import MConfirmEdit from './index.vue'

describe('useConfirmEditTransaction', () => {
  it('wires an activator to the public adaptive editor', async () => {
    const host = document.createElement('div')
    host.id = 'ui-overlay-host'
    document.body.appendChild(host)
    const wrapper = await mountSuspended(MConfirmEdit, {
      props: { modelValue: { name: 'Ada' }, presentation: 'popover' },
      slots: {
        activator: ({ props }: { props: Record<string, unknown> }) => h('button', props, 'Edit'),
        editor: ({ draft }: { draft: { name: string } }) => h('span', draft.name),
      },
    })
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    expect(document.querySelector('.ui-confirm-edit')).toBeTruthy()
    wrapper.unmount()
    host.remove()
  })

  it('isolates object drafts and commits async normalized results', async () => {
    const scope = effectScope()
    const model = ref({ name: 'before' })
    const open = ref(true)
    const save = vi.fn(async draft => ({ ...draft, name: draft.name.trim() }))
    const transaction = scope.run(() => useConfirmEditTransaction({ model, open, save }))!
    transaction.patchDraft({ name: ' after ' })
    expect(model.value.name).toBe('before')
    expect(transaction.dirty.value).toBe(true)
    expect(await transaction.save()).toBe(true)
    expect(model.value.name).toBe('after')
    scope.stop()
  })

  it('preserves dirty draft and marks an external conflict', async () => {
    const scope = effectScope()
    const model = ref({ count: 1 })
    const open = ref(true)
    const transaction = scope.run(() => useConfirmEditTransaction({ model, open }))!
    transaction.patchDraft({ count: 2 })
    model.value = { count: 3 }
    await nextTick()
    expect(transaction.draft.value.count).toBe(2)
    expect(transaction.committed.value.count).toBe(3)
    expect(transaction.conflicted.value).toBe(true)
    transaction.sync()
    expect(transaction.draft.value.count).toBe(3)
    scope.stop()
  })
})
