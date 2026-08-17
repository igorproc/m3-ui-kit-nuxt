import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MProgress from './index.vue'
import MProgressLinear from './linear/index.vue'
import MProgressCircular from './circular/index.vue'

describe('m-progress (switch)', () => {
  it('renders the linear leaf by default (type=linear)', async () => {
    const wrapper = await mountSuspended(MProgress)

    expect(wrapper.find('.ui-progress--linear').exists()).toBe(true)
    expect(wrapper.find('.ui-progress--circular').exists()).toBe(false)
  })

  it('renders the circular leaf when type=circular', async () => {
    const wrapper = await mountSuspended(MProgress, {
      props: { type: 'circular' },
    })

    expect(wrapper.find('.ui-progress--circular').exists()).toBe(true)
    expect(wrapper.find('.ui-progress--linear').exists()).toBe(false)
  })

  it('forwards geometry props (size) to the leaf', async () => {
    const wrapper = await mountSuspended(MProgress, {
      props: { type: 'linear', size: 'large' },
    })

    expect(wrapper.find('.ui-progress').classes()).toContain('ui-progress--large')
  })
})

describe('m-progress-linear', () => {
  it('exposes the progressbar role with aria bounds and label', async () => {
    const wrapper = await mountSuspended(MProgressLinear, {
      props: { value: 40, ariaLabel: 'Upload' },
    })

    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-valuenow')).toBe('40')
    expect(bar.attributes('aria-label')).toBe('Upload')
  })

  it('drops aria-valuenow and adds the indeterminate class when indeterminate', async () => {
    const wrapper = await mountSuspended(MProgressLinear, {
      props: { indeterminate: true },
    })

    expect(wrapper.classes()).toContain('ui-progress--indeterminate')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow'))
      .toBeUndefined()
  })

  it('renders the track when showTrack is true and omits it when false', async () => {
    const withTrack = await mountSuspended(MProgressLinear, {
      props: { showTrack: true },
    })
    const withoutTrack = await mountSuspended(MProgressLinear, {
      props: { showTrack: false },
    })

    expect(withTrack.find('.ui-progress__track').exists()).toBe(true)
    expect(withoutTrack.find('.ui-progress__track').exists()).toBe(false)
  })

  it('maps the size prop to a class', async () => {
    const wrapper = await mountSuspended(MProgressLinear, {
      props: { size: 'small' },
    })

    expect(wrapper.classes()).toContain('ui-progress--small')
  })
})

describe('m-progress-circular', () => {
  it('exposes the progressbar role with aria-valuenow', async () => {
    const wrapper = await mountSuspended(MProgressCircular, {
      props: { value: 75 },
    })

    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.classes()).toContain('ui-progress--circular')
    expect(bar.attributes('aria-valuenow')).toBe('75')
  })

  it('renders the svg track + value paths', async () => {
    const wrapper = await mountSuspended(MProgressCircular, {
      props: { value: 50 },
    })

    expect(wrapper.find('.ui-progress__svg-track').exists()).toBe(true)
    expect(wrapper.find('.ui-progress__svg-value').exists()).toBe(true)
  })
})
