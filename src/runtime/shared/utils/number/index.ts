export type NumberInputInvalidReason = 'empty' | 'incomplete' | 'invalid' | 'out-of-range'

export type NumberParseResult
  = | { ok: true, value: number }
    | { ok: false, reason: Exclude<NumberInputInvalidReason, 'out-of-range'> }

export interface NumberCodecOptions {
  locale?: string
  useGrouping?: boolean
  precision?: number
}
export interface NumberCodec {
  decimal: string
  group: string
  minus: string
  parse: (draft: string) => NumberParseResult
  format: (value: number | null, mode?: 'display' | 'edit') => string
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function precisionFromStep(step: number) {
  const value = String(step).toLowerCase()
  if (value.includes('e-')) return Number(value.split('e-')[1]) || 0
  return value.includes('.') ? value.length - value.indexOf('.') - 1 : 0
}

export function roundDecimal(value: number, precision: number) {
  const scale = 10 ** Math.max(0, precision)
  return Math.round((value + Number.EPSILON) * scale) / scale
}

export function clampNumber(value: number, min?: number, max?: number) {
  return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, value))
}

export function createNumberCodec(options: NumberCodecOptions = {}): NumberCodec {
  const locale = options.locale || 'en-US'
  const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(-12345.6)
  const decimal = parts.find(part => part.type === 'decimal')?.value ?? '.'
  const group = parts.find(part => part.type === 'group')?.value ?? ','
  const minus = parts.find(part => part.type === 'minusSign')?.value ?? '-'
  const groupPattern = new RegExp(`[${escapeRegExp(group)}\\s\\u00a0\\u202f]`, 'g')
  const decimalPattern = new RegExp(escapeRegExp(decimal), 'g')
  const formatter = new Intl.NumberFormat(locale, {
    useGrouping: options.useGrouping ?? true,
    minimumFractionDigits: 0,
    maximumFractionDigits: options.precision ?? 20,
  })
  const editor = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: options.precision ?? 20,
  })

  function parse(draft: string): NumberParseResult {
    const trimmed = draft.trim()
    if (trimmed === '') return { ok: false, reason: 'empty' }
    if (trimmed === minus || trimmed === '-' || trimmed === '+') {
      return { ok: false, reason: 'incomplete' }
    }
    if (trimmed.endsWith(decimal)) return { ok: false, reason: 'incomplete' }

    const normalized = trimmed
      .replace(groupPattern, '')
      .replace(decimalPattern, '.')
      .replace(minus, '-')

    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
      return { ok: false, reason: 'invalid' }
    }

    const value = Number(normalized)
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, reason: 'invalid' }
  }

  function format(value: number | null, mode: 'display' | 'edit' = 'display') {
    if (value === null || !Number.isFinite(value)) return ''
    return (mode === 'display' ? formatter : editor).format(value)
  }

  return { decimal, group, minus, parse, format }
}
