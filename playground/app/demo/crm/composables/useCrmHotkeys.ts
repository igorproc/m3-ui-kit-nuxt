import { useHotkey } from '#kit/composables/hotkey/useHotkey'

export interface CrmHotkeyOptions {
  /** Shortcuts stay off while a dialog, sheet or drawer owns the keyboard. */
  enabled: () => boolean
  focusSearch: () => void
  newDeal: () => void
}

/**
 * «/» focuses the search, «N» opens a new deal. `useHotkey` matches
 * `KeyboardEvent.key`, so on the Russian layout the N key types «т» and needs a
 * registration of its own.
 */
export function useCrmHotkeys(options: CrmHotkeyOptions) {
  const search = useHotkey(['/'], options.focusSearch, { enabled: options.enabled })
  const newDeal = useHotkey(['n'], options.newDeal, { enabled: options.enabled })
  useHotkey(['т'], options.newDeal, { enabled: options.enabled })

  return { search, newDeal }
}
