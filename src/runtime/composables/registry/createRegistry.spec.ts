import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from './createRegistry'

const ids = (registry: { values: () => readonly { id: unknown }[] }) => registry.values().map(ticket => ticket.id)

describe('createRegistry', () => {
  describe('registration', () => {
    it('indexes tickets in order and derives the value from the index when none is given', () => {
      const registry = createRegistry()
      const a = registry.register({ id: 'a' })
      const b = registry.register({ id: 'b', value: 'beta' })

      expect(a).toMatchObject({ id: 'a', index: 0, value: 0, valueIsIndex: true })
      expect(b).toMatchObject({ id: 'b', index: 1, value: 'beta', valueIsIndex: false })
      expect(registry.size).toBe(2)
      expect(registry.lookup(1)).toBe('b')
      expect(registry.browse('beta')).toEqual(['b'])
      expect(registry.has('a')).toBe(true)
      expect(registry.get('a')).toBe(a)
    })

    it('returns the existing ticket for a duplicate id instead of registering twice', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const registry = createRegistry()
      const first = registry.register({ id: 'a', value: 1 })
      const again = registry.register({ id: 'a', value: 2 })

      expect(again).toBe(first)
      expect(registry.size).toBe(1)
      expect(first.value).toBe(1)
      warn.mockRestore()
    })

    it('groups ids sharing a value and returns a copy of the bucket', () => {
      const registry = createRegistry()
      registry.register({ id: 'a', value: 'x' })
      registry.register({ id: 'b', value: 'x' })

      const bucket = registry.browse('x')!
      expect(bucket).toEqual(['a', 'b'])
      ;(bucket as string[]).push('zzz')
      expect(registry.browse('x')).toEqual(['a', 'b'])
      expect(registry.browse('missing')).toBeUndefined()
    })

    it('unregisters through the ticket sugar', () => {
      const registry = createRegistry()
      const a = registry.register({ id: 'a' })
      a.unregister()

      expect(registry.has('a')).toBe(false)
    })
  })

  describe('reindexing', () => {
    it('shifts index-derived values down at once when an earlier ticket leaves', () => {
      const registry = createRegistry()
      registry.register({ id: 'a' })
      registry.register({ id: 'b' })
      const c = registry.register({ id: 'c' })

      registry.unregister('a')

      expect(c).toMatchObject({ index: 1, value: 1 })
      expect(registry.lookup(0)).toBe('b')
      expect(registry.browse(1)).toEqual(['c'])
      expect(registry.browse(2)).toBeUndefined()
    })

    it('reindexes explicit-value tickets lazily, on the next read', () => {
      const registry = createRegistry()
      registry.register({ id: 'a', value: 'x' })
      const b = registry.register({ id: 'b', value: 'y' })

      registry.unregister('a')
      expect(registry.lookup(0)).toBe('b')
      expect(b.index).toBe(0)
      expect(b.value).toBe('y')
    })
  })

  describe('upsert', () => {
    it('inserts a missing ticket', () => {
      const registry = createRegistry()
      const ticket = registry.upsert('a', { value: 'x' })

      expect(ticket).toMatchObject({ id: 'a', index: 0, value: 'x' })
    })

    it('moves the ticket between value buckets and falls back to the index on an undefined value', () => {
      const registry = createRegistry()
      registry.register({ id: 'a', value: 'x' })

      registry.upsert('a', { value: 'y' })
      expect(registry.browse('x')).toBeUndefined()
      expect(registry.browse('y')).toEqual(['a'])

      const ticket = registry.upsert('a', { value: undefined })
      expect(ticket).toMatchObject({ value: 0, valueIsIndex: true })
      expect(registry.browse(0)).toEqual(['a'])
    })

    it('keeps id and index even when the patch tries to change them', () => {
      const registry = createRegistry()
      registry.register({ id: 'a' })
      const ticket = registry.upsert('a', { id: 'z', index: 7 } as never)

      expect(ticket).toMatchObject({ id: 'a', index: 0 })
    })
  })

  describe('snapshots', () => {
    it('caches keys/values/entries until the next mutation', () => {
      const registry = createRegistry()
      registry.register({ id: 'a' })

      const keys = registry.keys()
      const values = registry.values()
      const entries = registry.entries()
      expect(registry.keys()).toBe(keys)
      expect(registry.values()).toBe(values)
      expect(registry.entries()).toBe(entries)

      registry.register({ id: 'b' })
      expect(registry.keys()).not.toBe(keys)
      expect(registry.keys()).toEqual(['a', 'b'])
      expect(registry.entries().map(([id]) => id)).toEqual(['a', 'b'])
    })

    it('returns fresh arrays in reactive mode', () => {
      const registry = createRegistry({ reactive: true })
      registry.register({ id: 'a' })

      expect(registry.values()).not.toBe(registry.values())
      expect(registry.keys()).toEqual(['a'])
    })
  })

  describe('events', () => {
    it('does nothing and warns when events are disabled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const registry = createRegistry()
      const cb = vi.fn()

      registry.on('register:ticket', cb)
      registry.register({ id: 'a' })

      expect(cb).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('reports register, update, unregister, reindex and clear', () => {
      const registry = createRegistry({ events: true })
      const log: string[] = []
      for (const name of ['register:ticket', 'update:ticket', 'unregister:ticket', 'reindex:registry', 'clear:registry'] as const) {
        registry.on(name, (data: unknown) => log.push(`${name}:${(data as { id?: string } | undefined)?.id ?? '-'}`))
      }

      registry.register({ id: 'a' })
      registry.register({ id: 'b' })
      registry.upsert('b', { value: 'x' })
      registry.unregister('a')
      registry.clear()

      expect(log).toEqual([
        'register:ticket:a',
        'register:ticket:b',
        'update:ticket:b',
        'unregister:ticket:a',
        'clear:registry:-',
      ])
    })

    it('emits a custom event after the update when upsert names one', () => {
      const registry = createRegistry({ events: true })
      const log: string[] = []
      registry.on('update:ticket', () => log.push('update'))
      registry.on('custom:thing', () => log.push('custom'))
      registry.register({ id: 'a' })

      registry.upsert('a', { value: 1 }, 'custom:thing')
      expect(log).toEqual(['update', 'custom'])
    })

    it('stops calling a callback after off()', () => {
      const registry = createRegistry({ events: true })
      const cb = vi.fn()
      registry.on('register:ticket', cb)
      registry.off('register:ticket', cb)
      registry.register({ id: 'a' })

      expect(cb).not.toHaveBeenCalled()
    })

    it('drops every listener on dispose and clears the tickets', () => {
      const registry = createRegistry({ events: true })
      const cb = vi.fn()
      registry.register({ id: 'a' })
      registry.on('register:ticket', cb)

      registry.dispose()
      registry.register({ id: 'b' })

      expect(cb).not.toHaveBeenCalled()
      expect(ids(registry)).toEqual(['b'])
    })
  })

  describe('batch', () => {
    it('holds events until the batch ends and returns its result', () => {
      const registry = createRegistry({ events: true })
      const log: string[] = []
      registry.on('register:ticket', ticket => void log.push(String(ticket.id)))

      const result = registry.batch(() => {
        registry.register({ id: 'a' })
        registry.register({ id: 'b' })
        expect(log).toEqual([])
        return 'done'
      })

      expect(result).toBe('done')
      expect(log).toEqual(['a', 'b'])
    })

    it('runs a nested batch inline and flushes once at the outer end', () => {
      const registry = createRegistry({ events: true })
      const log: string[] = []
      registry.on('register:ticket', ticket => void log.push(String(ticket.id)))

      registry.batch(() => {
        registry.batch(() => registry.register({ id: 'a' }))
        expect(log).toEqual([])
      })
      expect(log).toEqual(['a'])
    })

    it('refreshes the snapshot cache once the batch ends', () => {
      const registry = createRegistry()
      registry.register({ id: 'a' })
      const before = registry.values()

      registry.batch(() => registry.register({ id: 'b' }))
      expect(registry.values()).not.toBe(before)
      expect(ids(registry)).toEqual(['a', 'b'])
    })

    it('onboard registers many tickets in one batch', () => {
      const registry = createRegistry({ events: true })
      const log: string[] = []
      registry.on('register:ticket', ticket => void log.push(String(ticket.id)))

      const tickets = registry.onboard([{ id: 'a' }, { id: 'b', value: 'x' }])
      expect(tickets.map(ticket => ticket.index)).toEqual([0, 1])
      expect(log).toEqual(['a', 'b'])
    })
  })

  describe('offboard', () => {
    it('removes tickets, reports each, and returns their input shapes', () => {
      const registry = createRegistry<{ id?: string, value?: unknown, label?: string }>({ events: true })
      const log: string[] = []
      registry.on('unregister:ticket', ticket => void log.push(String(ticket.id)))
      registry.register({ id: 'a', label: 'auto' })
      registry.register({ id: 'b', value: 'x', label: 'given' })
      registry.register({ id: 'c' })

      const removed = registry.offboard(['a', 'b', 'missing'])

      expect(removed).toEqual([{ label: 'auto' }, { id: 'b', value: 'x', label: 'given' }])
      expect(log).toEqual(['a', 'b'])
      expect(registry.lookup(0)).toBe('c')
      expect(registry.get('c')).toMatchObject({ index: 0, value: 0 })
    })
  })

  describe('ordering', () => {
    it('moves a ticket to a clamped index and reindexes everyone', () => {
      const registry = createRegistry({ events: true })
      const updates: string[] = []
      registry.on('update:ticket', ticket => void updates.push(String(ticket.id)))
      registry.onboard([{ id: 'a' }, { id: 'b' }, { id: 'c' }])

      registry.move('a', 99)
      expect(ids(registry)).toEqual(['b', 'c', 'a'])
      expect(registry.get('a')).toMatchObject({ index: 2, value: 2 })
      expect(registry.lookup(0)).toBe('b')
      expect(updates).toEqual(['a'])

      expect(registry.move('missing', 0)).toBeUndefined()
      expect(registry.move('a', 2)).toBe(registry.get('a'))
    })

    it('reorders to a full permutation and ignores anything else', () => {
      const registry = createRegistry()
      registry.onboard([{ id: 'a' }, { id: 'b' }, { id: 'c' }])

      registry.reorder(['c', 'a', 'b'])
      expect(ids(registry)).toEqual(['c', 'a', 'b'])
      expect(registry.get('c')).toMatchObject({ index: 0, value: 0 })

      registry.reorder(['a', 'b'])
      registry.reorder(['a', 'a', 'b'])
      registry.reorder(['a', 'b', 'zzz'])
      expect(ids(registry)).toEqual(['c', 'a', 'b'])
    })
  })

  describe('seek', () => {
    const setup = () => {
      const registry = createRegistry<{ id?: string, value?: unknown, disabled?: boolean }>()
      registry.onboard([{ id: 'a' }, { id: 'b', disabled: true }, { id: 'c' }, { id: 'd', disabled: true }])
      return registry
    }

    it('returns undefined on an empty registry', () => {
      expect(createRegistry().seek()).toBeUndefined()
    })

    it('finds the first and last tickets', () => {
      const registry = setup()
      expect(registry.seek('first')?.id).toBe('a')
      expect(registry.seek('last')?.id).toBe('d')
    })

    it('scans from a clamped offset and honours the predicate in both directions', () => {
      const registry = setup()
      const enabled = (ticket: { disabled?: boolean }) => !ticket.disabled

      expect(registry.seek('first', 1, enabled)?.id).toBe('c')
      expect(registry.seek('last', 3, enabled)?.id).toBe('c')
      expect(registry.seek('last', 99)?.id).toBe('d')
      expect(registry.seek('first', -5)?.id).toBe('a')
      expect(registry.seek('first', 3, enabled)).toBeUndefined()
    })
  })

  it('clear resets indexes so new tickets start at zero', () => {
    const registry = createRegistry()
    registry.onboard([{ id: 'a' }, { id: 'b' }])
    registry.clear()
    const ticket = registry.register({ id: 'c' })

    expect(registry.size).toBe(1)
    expect(ticket).toMatchObject({ index: 0, value: 0 })
    expect(registry.browse(1)).toBeUndefined()
  })
})
