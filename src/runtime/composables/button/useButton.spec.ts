import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { useButton } from './useButton'

describe('useButton', () => {
  it('builds the BEM class group namespaced to the block', () => {
    const props = reactive({ variant: 'filled', color: 'primary', disabled: false, loading: false })
    const { rootClass } = useButton({ block: 'ui-button', props })

    expect(rootClass.value).toEqual([
      'ui-button',
      'ui-button--filled',
      'ui-button--primary',
      { 'ui-button--disabled': false, 'ui-button--loading': false },
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

  it('treats loading as disabled and flags aria-busy', () => {
    const props = reactive({ disabled: false, loading: true })
    const { isDisabled, rippleEnabled, rootAttrs, rootClass } = useButton({ block: 'ui-button', props })

    expect(isDisabled.value).toBe(true)
    expect(rippleEnabled.value).toBe(false)
    expect(rootAttrs.value['aria-busy']).toBe('true')
    expect(rootClass.value.at(-1)).toMatchObject({ 'ui-button--loading': true })
  })

  it('emits native button attributes by default', () => {
    const props = reactive({ type: 'submit', disabled: true })
    const { tag, rootAttrs } = useButton({ block: 'ui-button', props })

    expect(tag.value).toBe('button')
    expect(rootAttrs.value.type).toBe('submit')
    expect(rootAttrs.value.disabled).toBe(true)
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
})
