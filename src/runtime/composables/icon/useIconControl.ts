import { computed, watchEffect } from 'vue'
import type { ComputedRef } from 'vue'
import { findIconNameProblem, resolveIconName } from './iconName'

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

const GLYPH_ATTRS: Readonly<IconGlyphAttrs> = Object.freeze({
  'aria-hidden': 'true',
  'focusable': 'false',
})

export function useIconControl(props: IconControlProps): UseIconControlReturn {
  const glyph = computed(() => resolveIconName(props.name, props.filled))

  const rootAttrs = computed<IconRootAttrs>(() => props.label
    ? { 'role': 'img', 'aria-label': props.label }
    : { 'aria-hidden': 'true' })

  if (import.meta.dev) {
    watchEffect(() => {
      const problem = findIconNameProblem(props.name)
      if (problem) console.warn(problem)
    })
  }

  return { glyph, rootAttrs, glyphAttrs: GLYPH_ATTRS }
}
