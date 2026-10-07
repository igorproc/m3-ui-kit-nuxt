import { describe, expect, it } from 'vitest'
import { reactive, ref } from 'vue'
import { useSegmentedButton } from './useSegmentedButton'
import type { SegmentedItem, SegmentedValue } from './useSegmentedButton'

const items: SegmentedItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
  { label: 'Year', value: 'year' },
]

// behavior.md: the engine hands out attribute bags only — no classes, no data-*.
const presentationKeys = (bag: Record<string, unknown>) => Object.keys(bag).filter(key => key === 'class' || key.startsWith('data-'))

describe('useSegmentedButton', () => {
  describe('single choice', () => {
    const setup = (initial?: SegmentedValue) => {
      const model = ref<SegmentedValue | undefined>(initial)
      const engine = useSegmentedButton(model, reactive({ items, multiple: false, disabled: false }))
      // One bag type for both modes, so a test can read any attribute.
      const segmentAttrs = (item: SegmentedItem, index: number) => engine.segmentAttrs(item, index) as Record<string, unknown>
      return { model, ...engine, segmentAttrs }
    }

    it('is a radio group with one Tab stop on the checked button', () => {
      const { groupAttrs, segmentAttrs } = setup('week')

      expect(groupAttrs.value.role).toBe('radiogroup')
      expect(items.map((item, index) => segmentAttrs(item, index).tabindex)).toEqual([-1, 0, -1, -1])
      expect(segmentAttrs(items[1]!, 1)).toMatchObject({ 'role': 'radio', 'aria-checked': 'true' })
    })

    it('puts the Tab stop on the first enabled button while nothing is checked', () => {
      const { segmentAttrs } = setup()

      expect(segmentAttrs(items[0]!, 0).tabindex).toBe(0)
    })

    it('selects the clicked value', () => {
      const { model, segmentAttrs } = setup('day')

      ;(segmentAttrs(items[3]!, 3).onClick as () => void)()

      expect(model.value).toBe('year')
    })

    it('marks disabled items and hands out no presentation', () => {
      const { segmentAttrs } = setup('day')

      expect(segmentAttrs(items[2]!, 2).disabled).toBe(true)
      for (const [index, item] of items.entries()) {
        expect(presentationKeys(segmentAttrs(item, index))).toEqual([])
      }
    })
  })

  describe('multiple choice', () => {
    it('is a group of toggle buttons that add and remove values', () => {
      const model = ref<SegmentedValue | undefined>(['day'])
      const engine = useSegmentedButton(model, reactive({ items, multiple: true, disabled: false }))
      const { groupAttrs } = engine
      const segmentAttrs = (item: SegmentedItem, index: number) => engine.segmentAttrs(item, index) as Record<string, unknown>

      expect(groupAttrs.value.role).toBe('group')
      expect(segmentAttrs(items[0]!, 0)['aria-pressed']).toBe('true')
      expect(segmentAttrs(items[0]!, 0)).not.toHaveProperty('tabindex')

      ;(segmentAttrs(items[1]!, 1).onClick as () => void)()
      ;(segmentAttrs(items[0]!, 0).onClick as () => void)()

      expect(model.value).toEqual(['week'])
    })
  })

  it('takes a component as a segment ref', () => {
    const { segmentRef } = useSegmentedButton(ref('day'), reactive({ items, multiple: false, disabled: false }))
    const el = document.createElement('button')

    expect(() => segmentRef(0)({ $el: el })).not.toThrow()
    expect(() => segmentRef(1)(null)).not.toThrow()
  })
})
