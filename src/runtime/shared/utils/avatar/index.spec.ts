import { describe, expect, it } from 'vitest'
import { getAvatarInitials } from './index'

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
