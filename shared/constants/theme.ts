export const THEME_DEFINITIONS = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const THEME_CONTRASTS = {
  MEDIUM: 'medium',
}

export const THEME_PALLETS = {
  BROWN: {
    key: 'brown',
    allowedThemes: [THEME_DEFINITIONS.LIGHT, THEME_DEFINITIONS.DARK],
  },
  GREEN: {
    key: 'green',
    allowedThemes: [THEME_DEFINITIONS.DARK, THEME_DEFINITIONS.LIGHT],
  },
}
