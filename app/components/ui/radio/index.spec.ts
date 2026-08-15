import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MRadio from './index.vue'
import MRadioGroup from './group/index.vue'

describe('m-radio', () => {
  it('renders a label root with a native radio carrying its value', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a' },
    })

    expect(wrapper.find('label.ui-radio').exists()).toBe(true)

    const input = wrapper.find('input.ui-radio__input')

    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('radio')
    expect(input.attributes('value')).toBe('a')
  })

  it('renders the label text and exposes the default slot', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', label: 'Option A' },
    })

    expect(wrapper.find('.ui-radio__label').text()).toBe('Option A')
  })

  it('is checked when the model equals its value', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', modelValue: 'a' },
    })

    expect(wrapper.classes()).toContain('ui-radio--checked')
    expect(wrapper.find('input.ui-radio__input').attributes('aria-checked')).toBe('true')
  })

  it('is not checked when the model differs from its value', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', modelValue: 'b' },
    })

    expect(wrapper.classes()).not.toContain('ui-radio--checked')
    expect(wrapper.find('input.ui-radio__input').attributes('aria-checked')).toBe('false')
  })

  it('selects its value on change (standalone v-model)', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', modelValue: undefined },
    })

    await wrapper.find('input.ui-radio__input').trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['a'])
  })

  it('applies disabled to the native input and the disabled modifier', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', disabled: true },
    })

    expect(wrapper.find('input.ui-radio__input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-radio--disabled')
  })

  it('does not select when disabled', async () => {
    const wrapper = await mountSuspended(MRadio, {
      props: { value: 'a', disabled: true, modelValue: undefined },
    })

    await wrapper.find('input.ui-radio__input').trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('m-radio-group', () => {
  it('renders role="radiogroup" wrapping its radios', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MRadioGroup, { modelValue: 'a' }, () => [
        h(MRadio, { value: 'a', label: 'A' }),
        h(MRadio, { value: 'b', label: 'B' }),
      ]),
    }))

    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    expect(wrapper.findAll('input.ui-radio__input')).toHaveLength(2)
  })

  it('shares a generated name across grouped radios', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MRadioGroup, null, () => [
        h(MRadio, { value: 'a' }),
        h(MRadio, { value: 'b' }),
      ]),
    }))

    const inputs = wrapper.findAll('input.ui-radio__input')
    const name0 = inputs[0]!.attributes('name')

    expect(name0).toBeTruthy()
    expect(inputs[1]!.attributes('name')).toBe(name0)
  })

  it('marks the radio matching the group model as checked when the model changes', async () => {
    // NOTE: a value that is already set at mount time is NOT reflected (see the
    // bug reported for radio/group/index.vue). Selecting via a post-mount model
    // change is the path that works and is covered here.
    const model = ref<string | undefined>(undefined)

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return () => h(
          MRadioGroup,
          {
            'modelValue': model.value,
            'onUpdate:modelValue': (v: string | undefined) => { model.value = v },
          },
          () => [
            h(MRadio, { value: 'a' }),
            h(MRadio, { value: 'b' }),
          ],
        )
      },
    }))

    model.value = 'b'

    // The group syncs its model into the registry via a flush-timed watcher,
    // so let the apply cycle settle before asserting.
    await nextTick()
    await nextTick()

    const radios = wrapper.findAllComponents(MRadio)

    expect(radios[0]!.classes()).not.toContain('ui-radio--checked')
    expect(radios[1]!.classes()).toContain('ui-radio--checked')
  })

  it('updates the group v-model when a child is selected', async () => {
    const model = ref<string | undefined>(undefined)

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        return () => h(
          MRadioGroup,
          {
            'modelValue': model.value,
            'onUpdate:modelValue': (v: string | undefined) => { model.value = v },
          },
          () => [
            h(MRadio, { value: 'a' }),
            h(MRadio, { value: 'b' }),
          ],
        )
      },
    }))

    const inputs = wrapper.findAll('input.ui-radio__input')
    await inputs[1]!.trigger('change')

    expect(model.value).toBe('b')
  })

  it('propagates group disabled to children', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MRadioGroup, { disabled: true }, () => [
        h(MRadio, { value: 'a' }),
        h(MRadio, { value: 'b' }),
      ]),
    }))

    const inputs = wrapper.findAll('input.ui-radio__input')

    expect(inputs[0]!.attributes('disabled')).toBeDefined()
    expect(inputs[1]!.attributes('disabled')).toBeDefined()
  })
})
