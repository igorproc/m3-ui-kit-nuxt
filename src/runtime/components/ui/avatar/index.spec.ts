import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { getAvatarInitials } from '#kit/shared/utils/avatar'
import MAvatar from './index.vue'

describe('getAvatarInitials', () => {
  it('returns an empty string for empty and whitespace-only names', () => {
    expect(getAvatarInitials('')).toBe('')
    expect(getAvatarInitials('   ')).toBe('')
  })

  it('uses the first and last words of a multi-word name', () => {
    expect(getAvatarInitials('Ada Lovelace')).toBe('AL')
    expect(getAvatarInitials('  grace   brewster   hopper ')).toBe('GH')
  })

  it('uses at most two clusters of a single word', () => {
    expect(getAvatarInitials('PrimeTime')).toBe('PR')
    expect(getAvatarInitials('X')).toBe('X')
  })

  it('counts grapheme clusters rather than UTF-16 units', () => {
    expect(Array.from(getAvatarInitials('👩‍🚀 Ада')).length).toBeGreaterThan(0)
    expect(getAvatarInitials('Ада Лавлейс')).toBe('АЛ')
    // A single emoji word stays one cluster, never a broken surrogate half.
    expect(getAvatarInitials('🚀')).toBe('🚀')
  })

  it('keeps RTL initials in logical order instead of reversing them', () => {
    expect(getAvatarInitials('سارة حسن')).toBe('سح')
  })

  it('upper-cases with the supplied locale', () => {
    expect(getAvatarInitials('istanbul', 'tr')).toBe('İS')
    expect(getAvatarInitials('istanbul')).toBe('IS')
  })
})

describe('MAvatar', () => {
  it('renders a tonal md avatar with the image when a source is given', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp', name: 'Ada Lovelace' } })
    const root = wrapper.find('.ui-avatar')
    expect(root.classes()).toEqual(expect.arrayContaining(['ui-avatar--md', 'ui-avatar--tonal', 'ui-avatar--shape-full']))
    expect(wrapper.find('.ui-avatar__image').attributes('src')).toBe('/a.webp')
    expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
  })

  it('falls back through initials, explicit icon and the default icon', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { name: 'Grace Hopper' } })
    expect(wrapper.find('.ui-avatar__initials').text()).toBe('GH')

    await wrapper.setProps({ name: '   ', icon: 'round-groups' })
    expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
    expect(wrapper.html()).toContain('round-groups')

    await wrapper.setProps({ icon: undefined })
    expect(wrapper.html()).toContain('round-person')
  })

  it('emits load and clears the pending error state', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp' } })
    const image = wrapper.find('.ui-avatar__image')
    await image.trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(true)
  })

  it('emits error once per source and shows the fallback', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/broken.webp', name: 'Ada Lovelace' } })
    await wrapper.find('.ui-avatar__image').trigger('error')
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
    expect(wrapper.find('.ui-avatar__initials').text()).toBe('AL')
  })

  it('retries only the new source after a failure', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/broken.webp' } })
    await wrapper.find('.ui-avatar__image').trigger('error')
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)

    await wrapper.setProps({ src: '/next.webp' })
    expect(wrapper.find('.ui-avatar__image').attributes('src')).toBe('/next.webp')
  })

  it('ignores a stale event fired for an obsolete source', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp' } })
    const image = wrapper.find('.ui-avatar__image')
    // Simulates a late event still carrying the previous source.
    image.element.setAttribute('src', '/old.webp')

    await image.trigger('error')
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(true)

    await image.trigger('load')
    expect(wrapper.emitted('load')).toBeUndefined()
  })

  it('does not emit a synthetic error for a missing source', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { name: 'Ada' } })
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
  })

  it('labels the root with the name and keeps the image decorative', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp', name: 'Ada Lovelace' } })
    const root = wrapper.find('.ui-avatar')
    expect(root.attributes('role')).toBe('img')
    expect(root.attributes('aria-label')).toBe('Ada Lovelace')
    expect(wrapper.find('.ui-avatar__image').attributes('alt')).toBe('')
  })

  it('lets an explicit alt name the image and an empty alt mark it decorative', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp', name: 'Ada', alt: 'Portrait of Ada' } })
    expect(wrapper.find('.ui-avatar').attributes('role')).toBeUndefined()
    expect(wrapper.find('.ui-avatar').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.ui-avatar__image').attributes('alt')).toBe('Portrait of Ada')

    await wrapper.setProps({ alt: '' })
    expect(wrapper.find('.ui-avatar__image').attributes('alt')).toBe('')
    expect(wrapper.find('.ui-avatar').attributes('aria-label')).toBeUndefined()
  })

  it('stays unlabeled without alt and name', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { src: '/a.webp' } })
    expect(wrapper.find('.ui-avatar').attributes('role')).toBeUndefined()
    expect(wrapper.find('.ui-avatar').attributes('aria-label')).toBeUndefined()
  })

  it('lets the default slot own the content and semantics', async () => {
    const wrapper = await mountSuspended(MAvatar, {
      props: { src: '/a.webp', name: 'Ada Lovelace' },
      slots: { default: ({ failed }: { failed: boolean }) => h('span', { class: 'custom' }, String(failed)) },
    })
    expect(wrapper.find('.ui-avatar__image').exists()).toBe(false)
    expect(wrapper.find('.custom').text()).toBe('false')
    expect(wrapper.find('.ui-avatar').attributes('role')).toBeUndefined()
  })

  it('replaces only the fallback through the fallback slot', async () => {
    const wrapper = await mountSuspended(MAvatar, {
      props: { name: 'PrimeTime' },
      slots: { fallback: ({ initials }: { initials: string }) => h('span', { class: 'mono' }, initials) },
    })
    expect(wrapper.find('.mono').text()).toBe('PR')
    expect(wrapper.find('.ui-avatar__initials').exists()).toBe(false)
  })

  it('applies each size, shape and variant token branch', async () => {
    const wrapper = await mountSuspended(MAvatar, { props: { size: 'lg', shape: 'medium', variant: 'outlined' } })
    expect(wrapper.find('.ui-avatar').classes()).toEqual(
      expect.arrayContaining(['ui-avatar--lg', 'ui-avatar--shape-medium', 'ui-avatar--outlined']),
    )
  })
})
