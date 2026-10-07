import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useButton } from './useButton'

const clickEvent = () => ({ preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() }) as unknown as Event

describe('useButton', () => {
  it('builds the BEM class group namespaced to the block', () => {
    const props = reactive({ variant: 'filled', color: 'primary', disabled: false, loading: false })
    const { rootClass } = useButton({ block: 'ui-button', props })

    expect(rootClass.value).toEqual([
      'ui-button',
      'ui-button--filled',
      'ui-button--primary',
      {
        'ui-button--disabled': false,
        'ui-button--loading': false,
        'ui-button--selected': false,
        'ui-button--unselected': false,
      },
    ])
  })

  it('includes size and caller-provided modifiers', () => {
    const props = reactive({ variant: 'tonal', color: 'secondary', size: 'lg' })
    const { rootClass } = useButton({
      block: 'ui-fab',
      props,
      modifiers: () => ({ 'icon-only': true }),
    })

    expect(rootClass.value).toContainEqual('ui-fab--lg')
    expect(rootClass.value.at(-1)).toMatchObject({ 'ui-fab--icon-only': true })
  })

  it('adds density and shape modifiers', () => {
    const props = reactive({ density: 'compact', shape: 'square' })
    const { rootClass } = useButton({ block: 'ui-button', props })

    expect(rootClass.value).toContainEqual('ui-button--compact')
    expect(rootClass.value).toContainEqual('ui-button--square')
  })

  it('treats loading as inactive but keeps the button focusable', () => {
    const props = reactive({ disabled: false, loading: true })
    const { isDisabled, rippleEnabled, rootAttrs, rootClass } = useButton({ block: 'ui-button', props })

    expect(isDisabled.value).toBe(true)
    expect(rippleEnabled.value).toBe(false)
    expect(rootAttrs.value['aria-busy']).toBe('true')
    expect(rootAttrs.value['aria-disabled']).toBe('true')
    expect(rootAttrs.value.disabled).toBe(false)
    expect(rootClass.value.at(-1)).toMatchObject({ 'ui-button--loading': true, 'ui-button--disabled': true })
  })

  it('swallows a click while loading, before any other listener sees it', () => {
    const props = reactive({ loading: true })
    const { rootAttrs } = useButton({ block: 'ui-button', props })
    const event = clickEvent()

    ;(rootAttrs.value.onClickCapture as (e: Event) => void)(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopImmediatePropagation).toHaveBeenCalled()
  })

  it('lets a click through when not loading', () => {
    const props = reactive({ loading: false })
    const { rootAttrs } = useButton({ block: 'ui-button', props })
    const event = clickEvent()

    ;(rootAttrs.value.onClickCapture as (e: Event) => void)(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('emits native button attributes by default', () => {
    const props = reactive({ type: 'submit', disabled: true })
    const { tag, rootAttrs } = useButton({ block: 'ui-button', props })

    expect(tag.value).toBe('button')
    expect(rootAttrs.value.type).toBe('submit')
    expect(rootAttrs.value.disabled).toBe(true)
    expect(rootAttrs.value['aria-disabled']).toBeUndefined()
  })

  it('switches to link attributes when tag is link', () => {
    const props = reactive({ tag: 'link' as const, to: '/next', disabled: true })
    const { isLink, tag, rootAttrs } = useButton({ block: 'ui-button', props })

    expect(isLink.value).toBe(true)
    expect(tag.value).not.toBe('button')
    expect(rootAttrs.value.to).toBe('/next')
    expect(rootAttrs.value['aria-disabled']).toBe('true')
    expect(rootAttrs.value.tabindex).toBe(-1)
    expect(rootAttrs.value.type).toBeUndefined()
    expect(rootAttrs.value.disabled).toBeUndefined()
  })

  it('keeps a loading link in the tab order', () => {
    const props = reactive({ tag: 'link' as const, loading: true })
    const { rootAttrs } = useButton({ block: 'ui-button', props })

    expect(rootAttrs.value['aria-disabled']).toBe('true')
    expect(rootAttrs.value.tabindex).toBeUndefined()
  })

  describe('toggle', () => {
    it('sets no pressed state on a plain button', () => {
      const props = reactive({})
      const { rootAttrs, rootClass } = useButton({ block: 'ui-button', props })

      expect(rootAttrs.value['aria-pressed']).toBeUndefined()
      expect(rootClass.value.at(-1)).toMatchObject({ 'ui-button--selected': false, 'ui-button--unselected': false })
    })

    it('reflects selected as aria-pressed and a modifier', () => {
      const props = reactive({ selected: false as boolean })
      const { rootAttrs, rootClass } = useButton({ block: 'ui-button', props })

      expect(rootAttrs.value['aria-pressed']).toBe('false')
      expect(rootClass.value.at(-1)).toMatchObject({ 'ui-button--unselected': true })

      props.selected = true
      expect(rootAttrs.value['aria-pressed']).toBe('true')
      expect(rootClass.value.at(-1)).toMatchObject({ 'ui-button--selected': true, 'ui-button--unselected': false })
    })

    it('reports the next state on click', () => {
      const onToggle = vi.fn()
      const props = reactive({ selected: true })
      const { rootAttrs } = useButton({ block: 'ui-button', props, onToggle })

      ;(rootAttrs.value.onClick as () => void)()

      expect(onToggle).toHaveBeenCalledWith(false)
    })

    it('does not toggle while disabled or loading', () => {
      const onToggle = vi.fn()
      const props = reactive({ selected: false, disabled: true, loading: false })
      const { rootAttrs } = useButton({ block: 'ui-button', props, onToggle })

      ;(rootAttrs.value.onClick as () => void)()
      props.disabled = false
      props.loading = true
      ;(rootAttrs.value.onClick as () => void)()

      expect(onToggle).not.toHaveBeenCalled()
    })

    it('puts no aria-pressed on a link', () => {
      const props = reactive({ tag: 'link' as const, selected: true })
      const { rootAttrs } = useButton({ block: 'ui-button', props })

      expect(rootAttrs.value['aria-pressed']).toBeUndefined()
    })
  })
})
