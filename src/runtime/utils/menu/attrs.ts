/**
 * @module utils/menu/attrs
 *
 * @remarks
 * `<MMenu>` renders two boxes: a positioned wrapper and the `role="menu"`
 * surface inside it. Its consumer's attributes belong to different ones:
 * what names or identifies the menu (`id`, `aria-*`, `role`) goes on the
 * element with the role; everything else (`class`, `style`, listeners) stays
 * on the wrapper, which is what a consumer styles and positions.
 */
export interface MenuAttrs {
  wrapper: Record<string, unknown>
  surface: Record<string, unknown>
  /** The consumer named the menu itself. */
  named: boolean
}

const belongsToSurface = (key: string) => key === 'id' || key === 'role' || key.startsWith('aria-')

export function splitMenuAttrs(attrs: Record<string, unknown>): MenuAttrs {
  const wrapper: Record<string, unknown> = {}
  const surface: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(attrs)) {
    if (belongsToSurface(key)) surface[key] = value
    else wrapper[key] = value
  }

  return { wrapper, surface, named: Boolean(surface['aria-label'] || surface['aria-labelledby']) }
}
