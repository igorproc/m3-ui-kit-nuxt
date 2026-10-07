import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useCard } from './useCard'
import type { UseCardProps } from './useCard'

// The escape hatch: the bags alone, spread on anonymous markup, carry the
// card's behaviour — and no presentation (no class, no data-*).
function mountBare(props: UseCardProps) {
  return mountSuspended(defineComponent({
    setup() {
      const { rootTag, rootAttrs, titleTag, titleAttrs } = useCard(props)

      return () => h(rootTag.value, rootAttrs.value, {
        default: () => [h(titleTag.value, titleAttrs.value, props.title), h('i', 'body')],
      })
    },
  }))
}

const presentationKeys = (attributes: Record<string, string>) =>
  Object.keys(attributes).filter(key => key === 'class' || key.startsWith('data-'))

describe('useCard', () => {
  it('names a static article by its title', async () => {
    const wrapper = await mountBare({ tag: 'article', disabled: false, title: 'Hello', headingLevel: 2 })
    const title = wrapper.find('h2')

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(presentationKeys(wrapper.attributes())).toEqual([])
  })

  it('renders an enabled link card as a Nuxt link named by its title', async () => {
    const wrapper = await mountBare({ tag: 'link', to: '/next', disabled: false, title: 'Go' })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/next')
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('p').attributes('id'))
    expect(presentationKeys(wrapper.attributes())).toEqual([])
  })

  it('leaves a link card without a title named by its content', async () => {
    const wrapper = await mountBare({ tag: 'link', to: '/next', disabled: false, title: '' })

    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
  })

  it('drops the destination of a disabled link card without tabindex games', async () => {
    const wrapper = await mountBare({ tag: 'link', to: '/next', disabled: true, title: 'Go' })

    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('p').attributes('id'))
    expect(presentationKeys(wrapper.attributes())).toEqual([])
  })

  it('only disables a link card', async () => {
    const wrapper = await mountBare({ tag: 'article', disabled: true, title: '' })

    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
  })
})
