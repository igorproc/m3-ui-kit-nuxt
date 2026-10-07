import { watchEffect, watchPostEffect } from 'vue'
import { useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import type { MCardTag } from './props'

// HTML "interactive content", plus anything made focusable: none of it may sit
// inside an `<a>`, so a link card cannot hold any of it validly.
const INTERACTIVE_CONTENT = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'details',
  'embed',
  'iframe',
  'label',
  'audio[controls]',
  'video[controls]',
  '[tabindex]',
].join(', ')

interface CardWarningSources {
  variant: () => string
  tag: () => MCardTag
  disabled: () => boolean
  /** The rendered parts that hold slot content; read through template refs. */
  parts: () => Array<Element | null | undefined>
}

/**
 * Dev-only warnings for an `<MCard>` used against its contract. Each names
 * the fix; none changes what renders (a link card still renders its actions).
 *
 * The interactive-content check reads the DOM after render, so it also sees
 * buttons a consumer put into `#media` or the default slot.
 */
export function useCardWarnings(sources: CardWarningSources) {
  if (!import.meta.dev) return

  useRetiredValueWarning('m-card', 'variant', sources.variant, { tonal: '`filled`', text: '`outlined`' })

  watchEffect(() => {
    if (!sources.disabled() || sources.tag() === 'link') return

    console.warn('[m-card] `disabled` applies to a link card only (`tag="link"`); a static card has no state to disable.')
  })

  let warned = false

  watchPostEffect(() => {
    if (warned || sources.tag() !== 'link') return
    if (!sources.parts().some(part => part?.querySelector(INTERACTIVE_CONTENT))) return

    warned = true
    console.warn('[m-card] a link card is one link and cannot contain interactive content (actions, buttons, links, fields): the HTML is invalid. Use a static card when it has actions.')
  })
}
