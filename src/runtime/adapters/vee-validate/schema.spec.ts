import { describe, expect, it } from 'vitest'
import { buildYupSchema } from './schema'

describe('buildYupSchema', () => {
  describe('numbers', () => {
    it('accepts an empty optional number', () => {
      const schema = buildYupSchema([{ name: 'age', kind: 'number' }])

      expect(schema.isValidSync({ age: null })).toBe(true)
    })

    it('refuses an empty required number', () => {
      const schema = buildYupSchema([{ name: 'age', kind: 'number', rules: { required: true } }])

      expect(schema.isValidSync({ age: null })).toBe(false)
      expect(schema.isValidSync({ age: 3 })).toBe(true)
    })

    it('keeps min and max on a nullable number', () => {
      const schema = buildYupSchema([{ name: 'age', kind: 'number', rules: { min: 18 } }])

      expect(schema.isValidSync({ age: 17 })).toBe(false)
      expect(schema.isValidSync({ age: null })).toBe(true)
    })
  })

  describe('strings', () => {
    it('applies required, length, email and pattern', () => {
      const schema = buildYupSchema([
        { name: 'email', kind: 'string', rules: { required: true, email: true } },
        { name: 'code', kind: 'string', rules: { min: 2, max: 4, pattern: '^[A-Z]+$' } },
      ])

      expect(schema.isValidSync({ email: 'a@b.co', code: 'AB' })).toBe(true)
      expect(schema.isValidSync({ email: '', code: 'AB' })).toBe(false)
      expect(schema.isValidSync({ email: 'nope', code: 'AB' })).toBe(false)
      expect(schema.isValidSync({ email: 'a@b.co', code: 'ab' })).toBe(false)
      expect(schema.isValidSync({ email: 'a@b.co', code: 'ABCDE' })).toBe(false)
    })
  })

  describe('enums', () => {
    it('accepts only the declared options', () => {
      const schema = buildYupSchema([{ name: 'plan', kind: 'enum', options: ['free', 'pro'] }])

      expect(schema.isValidSync({ plan: 'pro' })).toBe(true)
      expect(schema.isValidSync({ plan: 'gold' })).toBe(false)
    })
  })
})
