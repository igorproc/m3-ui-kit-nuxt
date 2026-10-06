/**
 * @module useSegmentedButton
 *
 * @remarks
 * Behaviour of `<MButtonSegmented>`: selection, the ARIA pattern and the
 * keyboard model. It produces attribute bags and no classes.
 *
 * The two modes are two different widgets, so they get two APG patterns:
 * - single choice is a **radio group** — one Tab stop, arrows move the
 *   selection, Home/End jump to the ends;
 * - multiple choice is a set of **toggle buttons** — each a Tab stop with
 *   `aria-pressed`.
 */
import { computed } from 'vue'
import type { Ref } from 'vue'

export interface SegmentedItem {
  label?: string
  /** Accessible name for a segment drawn with an icon only. */
  ariaLabel?: string
  icon?: string
  value: string | number
  disabled?: boolean
}

export type SegmentedValue = string | number | (string | number)[]

export interface SegmentedProps {
  items: SegmentedItem[]
  multiple: boolean
  disabled: boolean
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown'])
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp'])

export function useSegmentedButton(model: Ref<SegmentedValue | undefined>, props: SegmentedProps) {
  const segments: Array<HTMLElement | null> = []

  const isItemDisabled = (item: SegmentedItem) => props.disabled || Boolean(item.disabled)

  function isSelected(value: string | number) {
    if (props.multiple) return Array.isArray(model.value) && model.value.includes(value)

    return model.value === value
  }

  function select(value: string | number) {
    if (!props.multiple) {
      model.value = value
      return
    }

    const current = Array.isArray(model.value) ? model.value : []
    model.value = current.includes(value) ? current.filter(item => item !== value) : [...current, value]
  }

  const enabledIndexes = computed(() => props.items.flatMap((item, index) => (isItemDisabled(item) ? [] : [index])))

  // A radio group is one Tab stop: the checked segment, or the first enabled
  // one while nothing is checked.
  const tabStop = computed(() => {
    const checked = props.items.findIndex(item => !isItemDisabled(item) && isSelected(item.value))
    return checked >= 0 ? checked : (enabledIndexes.value[0] ?? -1)
  })

  function moveSelection(from: number, step: 1 | -1 | 'first' | 'last') {
    const enabled = enabledIndexes.value
    if (!enabled.length) return

    let target: number
    if (step === 'first') target = enabled[0]!
    else if (step === 'last') target = enabled.at(-1)!
    else {
      const position = enabled.indexOf(from)
      target = enabled[(position + step + enabled.length) % enabled.length]!
    }

    select(props.items[target]!.value)
    segments[target]?.focus()
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl'
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const flip = rtl && horizontal ? -1 : 1

    if (NEXT_KEYS.has(event.key)) moveSelection(index, (1 * flip) as 1 | -1)
    else if (PREVIOUS_KEYS.has(event.key)) moveSelection(index, (-1 * flip) as 1 | -1)
    else if (event.key === 'Home') moveSelection(index, 'first')
    else if (event.key === 'End') moveSelection(index, 'last')
    else return

    event.preventDefault()
  }

  const groupAttrs = computed(() => ({
    role: props.multiple ? 'group' : 'radiogroup',
  }))

  function segmentAttrs(item: SegmentedItem, index: number) {
    const selected = isSelected(item.value)
    const disabled = isItemDisabled(item)

    const shared = {
      'type': 'button' as const,
      disabled,
      'aria-label': item.ariaLabel,
      'onClick': () => select(item.value),
    }

    if (props.multiple) return { ...shared, 'aria-pressed': selected ? 'true' : 'false' }

    return {
      ...shared,
      'role': 'radio',
      'aria-checked': selected ? 'true' : 'false',
      'tabindex': index === tabStop.value ? 0 : -1,
      'onKeydown': (event: KeyboardEvent) => onKeydown(event, index),
    }
  }

  /** Template ref for segment `index`; arrow keys move focus through these. */
  function segmentRef(index: number) {
    return (el: unknown) => {
      segments[index] = el instanceof HTMLElement ? el : null
    }
  }

  return { isSelected, isItemDisabled, select, groupAttrs, segmentAttrs, segmentRef }
}
