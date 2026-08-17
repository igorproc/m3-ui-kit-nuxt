import { describe, expect, it } from 'vitest'
import { createFilePolicy, formatFileSize } from '../src/runtime/shared/utils/file'

describe('file policy', () => {
  it('validates type, size and count without mutating files', () => {
    const policy = createFilePolicy({ accept: 'image/*,.svg', maxSize: 10, maxFiles: 1 })
    const png = new File(['ok'], 'a.png', { type: 'image/png' })
    const svg = new File(['svg'], 'b.svg', { type: 'text/plain' })
    const text = new File(['too-long-content'], 'c.txt', { type: 'text/plain' })
    const result = policy.evaluate([png, svg, text])

    expect(result.accepted).toEqual([png])
    expect(result.rejected[0]).toMatchObject({ file: svg, reasons: ['count'] })
    expect(result.rejected[1]?.reasons).toEqual(expect.arrayContaining(['type', 'size', 'count']))
  })

  it('formats compact file sizes', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2 KB')
  })
})
