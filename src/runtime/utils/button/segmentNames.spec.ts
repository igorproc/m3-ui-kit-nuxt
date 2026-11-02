import { describe, expect, it } from 'vitest'
import type { SegmentedItem } from '#kit/composables/button/useSegmentedButton'
import { unnamedSegments } from './segmentNames'

// B8.3a: an icon-only choice needs its own name; the dev warning lists these values.
describe('unnamedSegments', () => {
  it('lists the values of icon-only items without an ariaLabel', () => {
    const items: SegmentedItem[] = [
      { value: 'grid', icon: 'ic:outline-dashboard' },
      { value: 'list', icon: 'ic:outline-list', ariaLabel: 'List' },
      { value: 'day', icon: 'ic:outline-today', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'blank' },
    ]

    expect(unnamedSegments(items)).toEqual(['grid', 'blank'])
  })

  it('is empty when every choice has a name', () => {
    expect(unnamedSegments([{ value: 'day', label: 'Day' }, { value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }])).toEqual([])
  })
})
