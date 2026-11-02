/**
 * @module messages
 *
 * @remarks
 * User-facing copy the kit still ships as a fallback, gathered here so it can be
 * pointed at a message source later. Each entry is the default of a prop, so an
 * app overrides the prop and never touches this file. Newer components ship no
 * copy at all: they take their phrases as props without defaults and warn in
 * development when a part on screen is left without words.
 *
 * Only phrases belong here. A number or a boolean default is not copy: it stays
 * a literal on the prop that exposes it, where the API table can show it.
 *
 * These are English because the kit has no locale of its own. Anything shown to
 * a user in a language the app chose should come from the app, not from here.
 */
export const MESSAGES = {
  hotkeyKeys: {
    command: 'Command',
    windows: 'Windows',
    super: 'Super',
    control: 'Control',
    option: 'Option',
    alt: 'Alt',
    shift: 'Shift',
    enter: 'Enter',
    escape: 'Escape',
    space: 'Space',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    arrowUp: 'Up',
    arrowDown: 'Down',
    arrowLeft: 'Left',
    arrowRight: 'Right',
  },
} as const
