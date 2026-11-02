import { computed, watchEffect } from 'vue'
import type { ComputedRef } from 'vue'
import { useGlyphFill } from './glyphFill'
import { describeUnknownGlyph, findIconNameProblem, resolveIconName } from './iconName'

export interface IconControlProps {
  name: string
  filled: boolean
  label?: string
}

export interface IconRootAttrs {
  'role'?: 'img'
  'aria-label'?: string
  'aria-hidden'?: 'true'
}

export interface IconGlyphAttrs {
  'aria-hidden': 'true'
  'focusable': 'false'
}

export interface UseIconControlReturn {
  glyph: ComputedRef<string>
  rootAttrs: ComputedRef<IconRootAttrs>
  glyphAttrs: Readonly<IconGlyphAttrs>
}

async function warnUnknownGlyph(name: string, glyph: string): Promise<void> {
  const { isKnownKitGlyph } = await import('./knownGlyphs')
  if (!isKnownKitGlyph(glyph)) console.warn(describeUnknownGlyph(name, glyph))
}

const GLYPH_ATTRS: Readonly<IconGlyphAttrs> = Object.freeze({
  'aria-hidden': 'true',
  'focusable': 'false',
})

export function useIconControl(props: IconControlProps): UseIconControlReturn {
  const inheritedFill = useGlyphFill()
  const glyph = computed(() => resolveIconName(props.name, props.filled || inheritedFill.value))

  const rootAttrs = computed<IconRootAttrs>(() => props.label
    ? { 'role': 'img', 'aria-label': props.label }
    : { 'aria-hidden': 'true' })

  if (import.meta.dev) {
    watchEffect(() => {
      const problem = findIconNameProblem(props.name)
      if (problem) console.warn(problem)
      else if (import.meta.server) warnUnknownGlyph(props.name, glyph.value).catch(console.warn)
    })
  }

  return { glyph, rootAttrs, glyphAttrs: GLYPH_ATTRS }
}
