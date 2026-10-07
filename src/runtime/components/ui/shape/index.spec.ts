import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { M3_SHAPE_SIZE, M3_SHAPES } from '#kit/assets/icon/shapes'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import { parsePath } from '#kit/utils/morph/parse'
import { samplePath } from '#kit/utils/morph/resample'
import MShape from './index.vue'

const SHAPE_NAMES = Object.keys(M3_SHAPES) as M3ShapeName[]
const SVG_DIR = resolve(process.cwd(), 'src/runtime/assets/icon/shapes')
const svgSources = readdirSync(SVG_DIR)
  .filter(file => file.endsWith('.svg'))
  .map(file => ({ file, source: readFileSync(resolve(SVG_DIR, file), 'utf8') }))

describe('m-shape', () => {
  it('renders an <svg> root with the ui-shape class', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
    expect(wrapper.classes()).toContain('ui-shape')
  })

  it('renders a single path filled with currentColor', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'square' } })

    const path = wrapper.find('path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('fill')).toBe('currentColor')
  })

  it('emits a non-empty path `d` for a known shape', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'heart' } })

    const d = wrapper.find('path').attributes('d')
    expect(d).toBeTruthy()
    expect(d!.length).toBeGreaterThan(0)
  })

  it.each(SHAPE_NAMES)('renders the canonical path of %s', async (name) => {
    const wrapper = await mountSuspended(MShape, { props: { name } })

    const d = wrapper.find('path').attributes('d')
    expect(d).toBe(M3_SHAPES[name])
    expect(d!.length).toBeGreaterThan(0)
  })

  it('draws on the catalog grid', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.attributes('viewBox')).toBe(`0 0 ${M3_SHAPE_SIZE} ${M3_SHAPE_SIZE}`)
  })

  it('defaults to the expressive transition', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.vm.transition.duration).toBe(610)
    expect(wrapper.vm.transition.rotate).toBe(60)
    expect(wrapper.vm.transition.preserveArea).toBe(true)
  })

  it('takes a transition by name', async () => {
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle', transition: 'calm' },
    })

    expect(wrapper.vm.transition.duration).toBe(231)
    expect(wrapper.vm.transition.rotate).toBe(0)
    expect(wrapper.vm.transition.overshoots).toBe(false)
  })

  it('takes a hand-written curve with its own duration', async () => {
    const quartic = (t: number): number => 1 - (1 - t) ** 4
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle', transition: { easing: quartic, duration: 600 } },
    })

    expect(wrapper.vm.transition.duration).toBe(600)
    expect(wrapper.vm.transition.easing(0.25)).toBeCloseTo(0.6836, 4)
    expect(wrapper.vm.transition.rotate).toBe(0)
  })

  it('lets duration override the transition', async () => {
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle', transition: 'calm', duration: 900 },
    })

    expect(wrapper.vm.transition.duration).toBe(900)
  })

  it('passes fallthrough attributes to the svg', async () => {
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle' },
      attrs: { 'class': 'avatar-mask', 'data-test': 'shape' },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-shape', 'avatar-mask']))
    expect(wrapper.attributes('data-test')).toBe('shape')
  })
})

describe('m-shape accessibility', () => {
  it('is hidden from assistive technology by default', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('focusable')).toBe('false')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('is announced as a named image when it has a label', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'sunny', label: 'Online' } })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Online')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('focusable')).toBe('false')
  })

  it.each(['', '   '])('stays decorative for the blank label %j', async (label) => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle', label } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('switches between decoration and image when the label changes', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    await wrapper.setProps({ label: 'Away' })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()

    await wrapper.setProps({ label: undefined })
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})

describe('m3 shape catalog', () => {
  it('is generated from every source svg', () => {
    const fromSources = svgSources.map(({ source }) => source.match(/<path[^>]*\sd="([^"]+)"/)?.[1])

    expect(fromSources).toHaveLength(SHAPE_NAMES.length)
    expect([...fromSources].sort()).toEqual(Object.values(M3_SHAPES).sort())
  })

  it.each(svgSources.map(({ file, source }) => [file, source]))('%s is drawn on the shared grid', (_file, source) => {
    expect(source).toContain(`viewBox="0 0 ${M3_SHAPE_SIZE} ${M3_SHAPE_SIZE}"`)
  })

  it.each(SHAPE_NAMES)('%s stays inside the grid', (name) => {
    const { pts } = samplePath(parsePath(M3_SHAPES[name]), 96)

    for (const value of pts) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(M3_SHAPE_SIZE)
    }
  })
})
