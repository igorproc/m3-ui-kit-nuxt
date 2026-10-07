export type InlineDirection = 'ltr' | 'rtl'

export function toLogicalScrollLeft(scrollLeft: number, direction: InlineDirection): number {
  return Math.max(0, direction === 'rtl' ? 0 - scrollLeft : scrollLeft)
}

export function toPhysicalScrollLeft(offset: number, direction: InlineDirection): number {
  const logical = Math.max(0, offset)
  return direction === 'rtl' ? 0 - logical : logical
}
