/**
 * @module color
 *
 * @remarks
 * Pure, shared color codec for `MColorPicker`, `MColorInput` and their edit
 * fields. The canonical boundary state is RGBA (`r,g,b` 0–255, `a` 0–1); HSVA
 * and HSLA are derived by pure conversion, never stored in parallel. Supports
 * HEX/HEXA, modern + legacy RGB(A) and HSL(A). Named colors, CSS variables,
 * `currentColor` and advanced color spaces are intentionally out of scope — the
 * pickers edit a concrete resolved color, not a cascade expression.
 */

/** Canonical color: r,g,b in 0–255, a in 0–1. */
export interface RGBA { r: number, g: number, b: number, a: number }
/** Hue 0–360, saturation/value 0–1, alpha 0–1. */
export interface HSVA { h: number, s: number, v: number, a: number }
/** Hue 0–360, saturation/lightness 0–1, alpha 0–1. */
export interface HSLA { h: number, s: number, l: number, a: number }

export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
export type ColorParseError = 'empty' | 'invalid-format' | 'out-of-range'

/** A palette entry: a raw color string or a labelled color. */
export type ColorSwatch = string | { value: string, label: string }

export type ColorParseResult
  = { ok: true, rgba: RGBA }
    | { ok: false, error: ColorParseError }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number, precision = 0) => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/** Formats a 0–255 channel as a two-digit hex pair. */
function channelToHex(channel: number): string {
  return clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')
}

// --- conversions -----------------------------------------------------------

export function rgbaToHsva({ r, g, b, a }: RGBA): HSVA {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : delta / max
  return { h, s, v: max, a }
}

export function hsvaToRgba({ h, s, v, a }: HSVA): RGBA {
  const hue = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c

  let rn = 0
  let gn = 0
  let bn = 0
  if (hue < 60) [rn, gn, bn] = [c, x, 0]
  else if (hue < 120) [rn, gn, bn] = [x, c, 0]
  else if (hue < 180) [rn, gn, bn] = [0, c, x]
  else if (hue < 240) [rn, gn, bn] = [0, x, c]
  else if (hue < 300) [rn, gn, bn] = [x, 0, c]
  else [rn, gn, bn] = [c, 0, x]

  return {
    r: round((rn + m) * 255),
    g: round((gn + m) * 255),
    b: round((bn + m) * 255),
    a,
  }
}

export function rgbaToHsla({ r, g, b, a }: RGBA): HSLA {
  const { h, s, v } = rgbaToHsva({ r, g, b, a })
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return { h, s: sl, l, a }
}

export function hslaToRgba({ h, s, l, a }: HSLA): RGBA {
  const v = l + s * Math.min(l, 1 - l)
  const sv = v === 0 ? 0 : 2 * (1 - l / v)
  return hsvaToRgba({ h, s: sv, v, a })
}

// --- parsing ---------------------------------------------------------------

function parseHex(input: string): ColorParseResult | null {
  const match = /^#?([0-9a-f]{3,8})$/i.exec(input.trim())
  if (!match) return null
  const hex = match[1]!
  const len = hex.length
  if (len !== 3 && len !== 4 && len !== 6 && len !== 8) {
    return { ok: false, error: 'invalid-format' }
  }

  const expand = (value: string) => (value.length === 1 ? value + value : value)
  const short = len === 3 || len === 4
  const r = Number.parseInt(expand(short ? hex[0]! : hex.slice(0, 2)), 16)
  const g = Number.parseInt(expand(short ? hex[1]! : hex.slice(2, 4)), 16)
  const b = Number.parseInt(expand(short ? hex[2]! : hex.slice(4, 6)), 16)
  const alphaHex = short ? hex[3] : hex.slice(6, 8)
  const a = alphaHex ? Number.parseInt(expand(alphaHex), 16) / 255 : 1

  return { ok: true, rgba: { r, g, b, a: round(a, 3) } }
}

function parseNumericChannel(token: string, scale: number): number | null {
  const trimmed = token.trim()
  if (trimmed.endsWith('%')) {
    const pct = Number.parseFloat(trimmed.slice(0, -1))
    return Number.isNaN(pct) ? null : (pct / 100) * scale
  }
  const value = Number.parseFloat(trimmed)
  return Number.isNaN(value) ? null : value
}

function parseAlpha(token: string | undefined): number {
  if (token === undefined) return 1
  const trimmed = token.trim()
  if (trimmed.endsWith('%')) return clamp(Number.parseFloat(trimmed) / 100, 0, 1)
  return clamp(Number.parseFloat(trimmed), 0, 1)
}

/** Split `rgb(...)`/`hsl(...)` args supporting both `,` and modern `a b c / d`. */
function splitFunctionArgs(body: string): { channels: string[], alpha?: string } {
  if (body.includes(',')) {
    const parts = body.split(',').map(part => part.trim())
    return { channels: parts.slice(0, 3), alpha: parts[3] }
  }
  const [main, alpha] = body.split('/')
  const channels = main!.trim().split(/\s+/).filter(Boolean)
  return { channels, alpha: alpha?.trim() }
}

function parseRgb(input: string): ColorParseResult | null {
  const match = /^rgba?\(([^)]*)\)$/i.exec(input.trim())
  if (!match) return null
  const { channels, alpha } = splitFunctionArgs(match[1]!)
  if (channels.length !== 3) return { ok: false, error: 'invalid-format' }

  const r = parseNumericChannel(channels[0]!, 255)
  const g = parseNumericChannel(channels[1]!, 255)
  const b = parseNumericChannel(channels[2]!, 255)
  if (r === null || g === null || b === null) return { ok: false, error: 'invalid-format' }

  return {
    ok: true,
    rgba: { r: clamp(round(r), 0, 255), g: clamp(round(g), 0, 255), b: clamp(round(b), 0, 255), a: round(parseAlpha(alpha), 3) },
  }
}

function parseHsl(input: string): ColorParseResult | null {
  const match = /^hsla?\(([^)]*)\)$/i.exec(input.trim())
  if (!match) return null
  const { channels, alpha } = splitFunctionArgs(match[1]!)
  if (channels.length !== 3) return { ok: false, error: 'invalid-format' }

  const h = Number.parseFloat(channels[0]!.replace(/deg$/i, ''))
  const s = parseNumericChannel(channels[1]!, 1)
  const l = parseNumericChannel(channels[2]!, 1)
  if (Number.isNaN(h) || s === null || l === null) return { ok: false, error: 'invalid-format' }

  return {
    ok: true,
    rgba: hslaToRgba({ h, s: clamp(s, 0, 1), l: clamp(l, 0, 1), a: round(parseAlpha(alpha), 3) }),
  }
}

/**
 * Parses a color string into canonical RGBA. Returns a discriminated result so
 * callers can surface a specific {@link ColorParseError}.
 */
export function parseColor(input: string | null | undefined): ColorParseResult {
  if (input == null || input.trim() === '') return { ok: false, error: 'empty' }
  const value = input.trim()

  const parsed = parseHex(value) ?? parseRgb(value) ?? parseHsl(value)
  return parsed ?? { ok: false, error: 'invalid-format' }
}

// --- formatting ------------------------------------------------------------

/** Formats canonical RGBA as a CSS-ready string in the requested family. */
export function formatColor(rgba: RGBA, format: ColorFormat): string {
  const r = clamp(Math.round(rgba.r), 0, 255)
  const g = clamp(Math.round(rgba.g), 0, 255)
  const b = clamp(Math.round(rgba.b), 0, 255)
  const a = round(clamp(rgba.a, 0, 1), 3)

  switch (format) {
    case 'hex':
      return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
    case 'hexa':
      return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}${channelToHex(a * 255)}`
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${a})`
    case 'hsl': {
      const { h, s, l } = rgbaToHsla({ r, g, b, a })
      return `hsl(${round(h)}, ${round(s * 100)}%, ${round(l * 100)}%)`
    }
    case 'hsla': {
      const { h, s, l } = rgbaToHsla({ r, g, b, a })
      return `hsla(${round(h)}, ${round(s * 100)}%, ${round(l * 100)}%, ${a})`
    }
  }
}

/** Whether a format carries an alpha channel. */
export function formatSupportsAlpha(format: ColorFormat): boolean {
  return format === 'hexa' || format === 'rgba' || format === 'hsla'
}

/** A CSS color string safe for a preview background (always RGBA). */
export function toCssColor(rgba: RGBA): string {
  return formatColor(rgba, 'rgba')
}

/** Relative luminance (WCAG) for choosing contrasting outline/text. */
export function isLightColor({ r, g, b }: RGBA): boolean {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

/** Normalizes a swatch entry to `{ value, label }`. */
export function normalizeSwatch(swatch: ColorSwatch): { value: string, label: string } {
  return typeof swatch === 'string' ? { value: swatch, label: swatch } : swatch
}
