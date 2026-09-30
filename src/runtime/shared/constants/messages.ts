/**
 * @module messages
 *
 * @remarks
 * User-facing copy the kit ships as a fallback. Gathered here so it can be
 * pointed at a message source later — today every one of these is also a prop,
 * so an app that only needs one string changed overrides that prop and never
 * touches this file.
 *
 * Only phrases belong here. A number or a boolean default is not copy: it stays
 * a literal on the prop that exposes it, where the API table can show it.
 *
 * These are English because the kit has no locale of its own. Anything shown to
 * a user in a language the app chose should come from the app, not from here.
 */
export const MESSAGES = {
  textareaResize: 'Resize',
  numberIncrement: 'Increase value',
  numberDecrement: 'Decrease value',
  numberUnit: 'Change unit',
  dropdownClear: 'Clear selection',
  dropdownToggle: 'Toggle options',
  dropdownLoading: 'Loading options',
  dropdownEmpty: 'No options',
  dropdownNoResults: 'No results',
} as const
