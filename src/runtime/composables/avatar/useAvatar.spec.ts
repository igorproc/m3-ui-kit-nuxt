import { describe, expect, it } from 'vitest'
import { defineComponent, h, reactive, useTemplateRef } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useAvatar } from './useAvatar'
import type { UseAvatarProps } from './useAvatar'

// The escape hatch: the bags alone, spread on anonymous markup, carry the
// avatar's behaviour — and no presentation (no class, no data-*).
function mountBare(initial: UseAvatarProps) {
  const props = reactive({ ...initial })
  const events: string[] = []

  const wrapper = mountSuspended(defineComponent({
    setup() {
      const image = useTemplateRef<HTMLImageElement>('image')
      const { showImage, initials, rootAttrs, imageAttrs } = useAvatar(props, {
        image,
        onLoad: () => events.push('load'),
        onError: () => events.push('error'),
      })

      return () => h('span', rootAttrs.value, [
        showImage.value ? h('img', { ref: 'image', ...imageAttrs.value }) : h('i', initials.value),
      ])
    },
  }))

  return { wrapper, props, events }
}

const presentationKeys = (attributes: Record<string, string>) =>
  Object.keys(attributes).filter(key => key === 'class' || key.startsWith('data-'))

describe('useAvatar', () => {
  it('names the avatar by `name` and keeps the image decorative, without presentation', async () => {
    const { wrapper } = mountBare({ src: '/a.webp', name: 'Ada Lovelace' })
    const root = await wrapper

    expect(root.attributes('role')).toBe('img')
    expect(root.attributes('aria-label')).toBe('Ada Lovelace')
    expect(root.find('img').attributes('alt')).toBe('')
    expect(presentationKeys(root.attributes())).toEqual([])
    expect(presentationKeys(root.find('img').attributes())).toEqual([])
  })

  it('moves the name from the image to the avatar when the image fails', async () => {
    const { wrapper, events } = mountBare({ src: '/broken.webp', name: 'Ada Lovelace', alt: 'Portrait' })
    const root = await wrapper

    expect(root.attributes('aria-label')).toBeUndefined()
    await root.find('img').trigger('error')

    expect(events).toEqual(['error'])
    expect(root.find('i').text()).toBe('AL')
    expect(root.attributes('aria-label')).toBe('Portrait')
  })

  it('tries a new source afresh after a failure', async () => {
    const { wrapper, props } = mountBare({ src: '/broken.webp' })
    const root = await wrapper

    await root.find('img').trigger('error')
    expect(root.find('img').exists()).toBe(false)

    props.src = '/next.webp'
    await root.vm.$nextTick()
    expect(root.find('img').attributes('src')).toBe('/next.webp')
  })
})
