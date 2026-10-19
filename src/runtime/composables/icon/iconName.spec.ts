import { describe, expect, it } from 'vitest'
import { ICONS } from '#kit/shared/constants/icons'
import { findIconNameProblem, resolveIconName } from './iconName'

describe('resolveIconName', () => {
  it.each([
    ['home', false, ICONS.home],
    ['chevronLeft', false, ICONS.chevronLeft],
    ['round-close', false, 'ic:round-close'],
    ['outline-home', false, 'ic:outline-home'],
    ['ic:outline-home', false, 'ic:outline-home'],
    ['mdi:account', false, 'mdi:account'],
    ['', false, ''],
    ['home', true, 'ic:baseline-home'],
    ['outline-star', true, 'ic:baseline-star'],
    ['ic:outline-star', true, 'ic:baseline-star'],
    ['ic:baseline-star', true, 'ic:baseline-star'],
    ['round-star', true, 'ic:round-star'],
    ['mdi:account', true, 'mdi:account'],
    ['', true, ''],
  ])('%s (filled: %s) → %s', (name, filled, expected) => {
    expect(resolveIconName(name, filled)).toBe(expected)
  })

  it('has a baseline pair for every kit glyph', () => {
    for (const value of Object.values(ICONS)) {
      expect(resolveIconName(value, true)).toBe(value.replace('ic:outline-', 'ic:baseline-'))
    }
  })

  it('does not treat inherited object keys as kit glyphs', () => {
    expect(resolveIconName('constructor')).toBe('ic:constructor')
  })
})

describe('findIconNameProblem', () => {
  it.each([
    'home',
    'chevronLeft',
    'round-close',
    'ic:outline-home',
    'mdi:account',
    'fluent-emoji-flat:red-heart',
  ])('accepts %s', (name) => {
    expect(findIconNameProblem(name)).toBeUndefined()
  })

  it('reports an empty name and points at ICONS', () => {
    const problem = findIconNameProblem('')

    expect(problem).toMatch(/^\[m-icon\] has no `name`/)
    expect(problem).toContain('`ICONS`')
  })

  it.each([
    'chevronLetf',
    'arrow_back',
    'Home',
    'ic:',
    ':home',
    'ic:outline home',
  ])('reports the malformed name %s and points at ICONS', (name) => {
    const problem = findIconNameProblem(name)

    expect(problem).toContain(`\`${name}\` is not an icon name`)
    expect(problem).toContain('`ICONS`')
  })
})
