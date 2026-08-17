import type { ComputedRef, Ref } from 'vue'

export interface ListboxEntry {
  id: string
  disabled: boolean
}

export function useListbox<TEntry extends ListboxEntry>(
  entries: ComputedRef<readonly TEntry[]>,
  open: Ref<boolean>,
  autoSelectFirst: () => boolean,
) {
  const activeIndex = ref(-1)
  const activeEntry = computed(() => entries.value[activeIndex.value])
  const activeDescendant = computed(() => activeEntry.value?.id)

  const enabledIndexes = () => entries.value
    .map((entry, index) => entry.disabled ? -1 : index)
    .filter(index => index >= 0)

  function setActive(index: number) {
    if (entries.value[index]?.disabled) return
    activeIndex.value = index
    nextTick(() => document.getElementById(entries.value[index]?.id ?? '')
      ?.scrollIntoView({ block: 'nearest' }))
  }

  function move(target: 'next' | 'previous' | 'first' | 'last') {
    const indexes = enabledIndexes()
    if (!indexes.length) {
      activeIndex.value = -1
      return
    }

    if (target === 'first') return setActive(indexes[0]!)
    if (target === 'last') return setActive(indexes.at(-1)!)

    const current = indexes.indexOf(activeIndex.value)
    const offset = target === 'next' ? 1 : -1
    const next = current < 0
      ? (target === 'next' ? 0 : indexes.length - 1)
      : (current + offset + indexes.length) % indexes.length
    setActive(indexes[next]!)
  }

  watch([open, entries], ([isOpen]) => {
    if (!isOpen) {
      activeIndex.value = -1
      return
    }
    const currentId = activeEntry.value?.id
    const current = entries.value.findIndex(entry => entry.id === currentId && !entry.disabled)
    if (current >= 0) activeIndex.value = current
    else if (autoSelectFirst()) move('first')
    else activeIndex.value = -1
  }, { flush: 'post' })

  return { activeIndex, activeEntry, activeDescendant, setActive, move }
}
