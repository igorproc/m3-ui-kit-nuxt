import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MIcon from '../app/components/ui/icon/index.vue'

describe('m-icon', () => {
  it('renders the icon wrapper span', async () => {
    const wrapper = await mountSuspended(MIcon, { props: { name: 'home' } })

    expect(wrapper.find('.ui-icon').exists()).toBe(true)
  })

  it('prefixes a bare name with the ic collection', async () => {
    const wrapper = await mountSuspended(MIcon, { props: { name: 'home' } })

    expect(wrapper.find('.ui-icon').html()).toContain('ic:home')
  })

  it('keeps an explicit collection prefix untouched', async () => {
    const wrapper = await mountSuspended(MIcon, { props: { name: 'mdi:account' } })

    const html = wrapper.find('.ui-icon').html()
    expect(html).toContain('mdi:account')
    expect(html).not.toContain('ic:mdi')
  })

  it('marks the inner icon as decorative (aria-hidden)', async () => {
    const wrapper = await mountSuspended(MIcon, { props: { name: 'home' } })

    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
  })
})
