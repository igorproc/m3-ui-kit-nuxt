import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useFabMenu } from './useFabMenu'

const keydown = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent

// behavior.md: the composable hands out attribute bags only — no classes, no data-*.
const presentationKeys = (bag: Record<string, unknown>) => Object.keys(bag).filter(key => key === 'class' || key.startsWith('data-'))

describe('useFabMenu', () => {
  it('describes a disclosure and hands out no presentation', () => {
    const { activatorAttrs, listAttrs, listId, open } = useFabMenu()

    expect(activatorAttrs.value['aria-expanded']).toBe('false')
    expect(activatorAttrs.value['aria-controls']).toBeUndefined()

    open()
    expect(activatorAttrs.value['aria-expanded']).toBe('true')
    expect(activatorAttrs.value['aria-controls']).toBe(listId)
    expect(listAttrs.value.id).toBe(listId)
    expect(presentationKeys(activatorAttrs.value)).toEqual([])
    expect(presentationKeys(listAttrs.value)).toEqual([])
  })

  it('drives an external open state', () => {
    const state = ref(false)
    const { toggle } = useFabMenu({ open: state })

    toggle()

    expect(state.value).toBe(true)
  })

  it('does not open while disabled or empty', () => {
    const disabled = useFabMenu({ disabled: true })
    disabled.open()
    expect(disabled.isOpen.value).toBe(false)

    const empty = useFabMenu({ hasContent: false })
    empty.toggle()
    expect(empty.isOpen.value).toBe(false)
  })

  it('closes on Escape and returns focus to the activator', async () => {
    const button = document.createElement('button')
    document.body.append(button)
    const { open, isOpen, listAttrs } = useFabMenu({ activator: () => button })

    open()
    ;(listAttrs.value.onKeydown as (event: KeyboardEvent) => void)(keydown('Escape'))
    await vi.waitFor(() => expect(document.activeElement).toBe(button))

    expect(isOpen.value).toBe(false)
    button.remove()
  })

  it('opens on ArrowDown and moves focus to the top action', async () => {
    const list = document.createElement('div')
    const top = document.createElement('button')
    list.append(top, document.createElement('button'))
    document.body.append(list)
    const { isOpen, activatorAttrs } = useFabMenu({ list: () => list })

    ;(activatorAttrs.value.onKeydown as (event: KeyboardEvent) => void)(keydown('ArrowDown'))
    await vi.waitFor(() => expect(document.activeElement).toBe(top))

    expect(isOpen.value).toBe(true)
    list.remove()
  })

  it('runs the action, emits select and closes when an item is chosen', () => {
    const action = vi.fn()
    const emit = vi.fn()
    const { open, isOpen, select } = useFabMenu<{ action?: () => void }>()
    const item = { action }

    open()
    select(item, emit)

    expect(action).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith('select', item)
    expect(isOpen.value).toBe(false)
  })
})
