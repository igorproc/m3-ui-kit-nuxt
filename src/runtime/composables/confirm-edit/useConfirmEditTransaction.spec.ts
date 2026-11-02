import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useConfirmEditTransaction } from './useConfirmEditTransaction'

describe('useConfirmEditTransaction', () => {
  it('saves a dirty draft and writes the stored value to the model', async () => {
    const model = ref('Ada')
    const save = vi.fn(async (draft: string) => draft.toUpperCase())
    const edit = useConfirmEditTransaction({ model, save })

    edit.begin()
    edit.setDraft('Grace')
    const result = await edit.commit()

    expect(result).toEqual({ outcome: 'saved', value: 'GRACE' })
    expect(model.value).toBe('GRACE')
    expect(edit.editing.value).toBe(false)
    expect(save).toHaveBeenCalledWith('Grace', expect.objectContaining({ committed: 'Ada' }))
  })

  it('closes an unchanged edit as saved without calling save', async () => {
    const save = vi.fn()
    const edit = useConfirmEditTransaction({ model: ref('Ada'), save })

    edit.begin()
    expect((await edit.commit()).outcome).toBe('saved')
    expect(save).not.toHaveBeenCalled()
  })

  it('keeps the edit open on an error, with the reason', async () => {
    const model = ref('Ada')
    const failure = new Error('offline')
    const edit = useConfirmEditTransaction({ model, save: () => Promise.reject(failure) })

    edit.begin()
    edit.setDraft('Grace')
    const result = await edit.commit()

    expect(result).toEqual({ outcome: 'error', value: 'Ada', error: failure })
    expect(edit.editing.value).toBe(true)
    expect(edit.draft.value).toBe('Grace')
    expect(model.value).toBe('Ada')
  })

  it('cancels a save in flight through its signal and keeps the model', async () => {
    const model = ref('Ada')
    let signal: AbortSignal | undefined
    let finish: (value: string) => void = () => {}
    const edit = useConfirmEditTransaction({
      model,
      save: (_draft, context) => {
        signal = context.signal
        return new Promise<string>((resolve) => {
          finish = resolve
        })
      },
    })

    edit.begin()
    edit.setDraft('Grace')
    const pending = edit.commit()
    expect(edit.pending.value).toBe(true)

    expect(edit.cancel().outcome).toBe('cancelled')
    expect(signal!.aborted).toBe(true)
    finish('Grace')

    expect((await pending).outcome).toBe('cancelled')
    expect(model.value).toBe('Ada')
  })

  it('waits for the first commit when called twice', async () => {
    const save = vi.fn(async (draft: string) => draft)
    const edit = useConfirmEditTransaction({ model: ref('Ada'), save })

    edit.begin()
    edit.setDraft('Grace')
    const [first, second] = await Promise.all([edit.commit(), edit.commit()])

    expect(first).toBe(second)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('turns an outside change under a dirty draft into a conflict, never an overwrite', async () => {
    const model = ref('Ada')
    const save = vi.fn(async (draft: string) => draft)
    const edit = useConfirmEditTransaction({ model, save })

    edit.begin()
    edit.setDraft('Grace')
    model.value = 'Barbara'
    await nextTick()

    expect(edit.conflicted.value).toBe(true)
    expect((await edit.commit()).outcome).toBe('conflict')
    expect(save).not.toHaveBeenCalled()

    edit.keepDraft()
    expect((await edit.commit()).outcome).toBe('saved')
    expect(model.value).toBe('Grace')
  })

  it('takes the outside value on request', async () => {
    const model = ref('Ada')
    const edit = useConfirmEditTransaction({ model })

    edit.begin()
    edit.setDraft('Grace')
    model.value = 'Barbara'
    await nextTick()
    edit.takeExternal()

    expect(edit.draft.value).toBe('Barbara')
    expect(edit.conflicted.value).toBe(false)
  })

  it('follows outside changes quietly while the draft is clean', async () => {
    const model = ref({ name: 'Ada' })
    const edit = useConfirmEditTransaction({ model })

    edit.begin()
    model.value = { name: 'Barbara' }
    await nextTick()

    expect(edit.conflicted.value).toBe(false)
    expect(edit.draft.value).toEqual({ name: 'Barbara' })
    expect(edit.draft.value).not.toBe(model.value)
  })

  // B9.7e: `v-model="tx.draft.value.name"` writes a nested field, not the draft.
  it('sees a field of the draft edited in place', async () => {
    const model = ref({ name: 'Ada', tags: ['math'] })
    const save = vi.fn(async (draft: { name: string, tags: string[] }) => draft)
    const edit = useConfirmEditTransaction({ model, save })

    edit.begin()
    // A template reads `dirty` on render, so it is cached before the edit.
    expect(edit.dirty.value).toBe(false)

    edit.draft.value.name = 'Grace'
    expect(edit.dirty.value).toBe(true)

    edit.draft.value.name = 'Ada'
    edit.draft.value.tags.push('navy')
    expect(edit.dirty.value).toBe(true)

    const result = await edit.commit()

    expect(result.outcome).toBe('saved')
    expect(model.value).toEqual({ name: 'Ada', tags: ['math', 'navy'] })
  })

  it('never lets an edit in place reach the committed value or the model', () => {
    const model = ref({ name: 'Ada' })
    const edit = useConfirmEditTransaction({ model })

    edit.begin()
    edit.draft.value.name = 'Grace'

    expect(edit.committed.value).toEqual({ name: 'Ada' })
    expect(model.value).toEqual({ name: 'Ada' })
  })
})
