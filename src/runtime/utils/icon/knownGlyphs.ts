/**
 * The kit's own `ic` set, read from its local `@iconify-json/ic` data — no
 * request leaves the process. Heavy (the whole set), so it is imported only on
 * the dev server, never shipped to the browser.
 */
import { icons } from '@iconify-json/ic'

const KIT_COLLECTION = `${icons.prefix}:`

/** Whether the `ic` set draws `glyph` (`ic:outline-home`); a glyph of another collection is not judged. */
export function isKnownKitGlyph(glyph: string): boolean {
  if (!glyph.startsWith(KIT_COLLECTION)) return true

  const name = glyph.slice(KIT_COLLECTION.length)

  return Object.hasOwn(icons.icons, name) || Object.hasOwn(icons.aliases ?? {}, name)
}
