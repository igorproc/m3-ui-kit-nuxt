import { describe, expect, it } from 'vitest'
import { actionName, dragRefused, splitFileName } from './upload'

describe('splitFileName', () => {
  it.each([
    ['contract.pdf', 'contract', '.pdf'],
    ['archive.tar.gz', 'archive.tar', '.gz'],
    ['README', 'README', ''],
    ['.env', '.env', ''],
    ['trailing.', 'trailing.', ''],
  ])('splits %s into %s and %s', (name, stem, extension) => {
    expect(splitFileName(name)).toEqual({ stem, extension })
  })
})

describe('dragRefused', () => {
  it('refuses a type no MIME rule takes', () => {
    expect(dragRefused('image/*,application/pdf', ['text/plain'])).toBe(true)
  })

  it('welcomes a type a rule takes', () => {
    expect(dragRefused('image/*', ['image/png'])).toBe(false)
    expect(dragRefused('application/pdf', ['application/pdf'])).toBe(false)
  })

  it('cannot tell by extension during a drag, so it welcomes', () => {
    expect(dragRefused('.pdf', ['text/plain'])).toBe(false)
  })

  it('welcomes anything without a rule or without types', () => {
    expect(dragRefused(undefined, ['text/plain'])).toBe(false)
    expect(dragRefused('image/*', [])).toBe(false)
  })
})

describe('actionName', () => {
  it('replaces every {name} with the file name', () => {
    expect(actionName('Retry {name}', 'a.pdf')).toBe('Retry a.pdf')
  })

  it('appends the name to a template without a placeholder', () => {
    expect(actionName('Remove', 'a.pdf')).toBe('Remove a.pdf')
  })

  it('gives no name without a template', () => {
    expect(actionName(undefined, 'a.pdf')).toBeUndefined()
  })
})
