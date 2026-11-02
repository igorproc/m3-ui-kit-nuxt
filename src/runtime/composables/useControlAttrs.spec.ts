import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useControlAttrs } from './useControlAttrs'

const Field = defineComponent({
  inheritAttrs: false,
  props: { own: { type: Object, default: undefined } },
  setup(props) {
    const { rootAttrs, controlAttrs } = useControlAttrs()
    return () => h('div', { ...rootAttrs(), 'data-test': 'root' }, [h('input', controlAttrs(props.own))])
  },
})

describe('useControlAttrs', () => {
  it('keeps class and style on the root and hands everything else to the control', async () => {
    const wrapper = await mountSuspended(Field, { attrs: { 'class': 'mine', 'style': 'color: red', 'aria-label': 'Name', 'name': 'n' } })

    expect(wrapper.find('[data-test="root"]').classes()).toContain('mine')
    expect(wrapper.find('input').attributes()).toMatchObject({ 'aria-label': 'Name', 'name': 'n' })
    expect(wrapper.find('input').attributes('class')).toBeUndefined()
  })

  it('lets the component\'s own value win a clash', async () => {
    const wrapper = await mountSuspended(Field, { props: { own: { 'aria-invalid': 'true' } }, attrs: { 'aria-invalid': 'false' } })

    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('leaves a consumer attribute alone when the component has nothing to say about it', async () => {
    const wrapper = await mountSuspended(Field, {
      props: { own: { 'tabindex': undefined, 'aria-labelledby': undefined, 'aria-describedby': 'own' } },
      attrs: { 'tabindex': '-1', 'aria-labelledby': 'outer' },
    })
    const input = wrapper.find('input')

    expect(input.attributes('tabindex')).toBe('-1')
    expect(input.attributes('aria-labelledby')).toBe('outer')
    expect(input.attributes('aria-describedby')).toBe('own')
  })

  it('chains listeners instead of replacing the consumer\'s', async () => {
    const calls: string[] = []
    const wrapper = await mountSuspended(Field, {
      props: { own: { onKeydown: () => calls.push('own') } },
      attrs: { onKeydown: () => calls.push('consumer') },
    })

    await wrapper.find('input').trigger('keydown')
    expect(calls.sort()).toEqual(['consumer', 'own'])
  })
})
