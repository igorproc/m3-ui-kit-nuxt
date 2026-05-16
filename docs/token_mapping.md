# Token Mapping Reference

This document maps the legacy theme variables (used in classic layouts) to the new Material Design 3 system tokens used in the PrimeTime UI Kit.

## Color Mapping

| Legacy Theme Variable (`themes/index.scss`) | M3 System Token (`$theme-color-link`) | Description |
| :--- | :--- | :--- |
| `--color-primary` | `primary` | Base brand color |
| `--color-primary-contrast` | `on-primary` | Text/Icon on primary |
| `--color-primary-container` | `primary-container` | Lighter primary container |
| `--color-primary-container-contrast` | `on-primary-container` | Text on primary container |
| **`--color-accent`** | **`secondary`** | **Deprecated `accent` -> `secondary`** |
| `--color-accent-contrast` | `on-secondary` | Text on secondary |
| `--color-accent-container` | `secondary-container` | Secondary container |
| `--color-accent-container-contrast` | `on-secondary-container` | Text on secondary container |
| **`--color-warn`** | **`error`** | **Deprecated `warn` -> `error`** |
| `--color-warn-contrast` | `on-error` | Text on error |
| `--color-warn-container` | `error-container` | Error container |
| `--color-warn-container-contrast` | `on-error-container` | Text on error container |
| `--color-surface` | `surface` | Standard surface |
| `--color-surface-contrast` | `on-surface` | Text on surface |
| `--color-surface-variant` | `surface-variant` | Neutral variant surface |
| `--color-surface-variant-contrast` | `on-surface-variant` | Text on surface variant |
| `--color-background` | `background` | App background |
| `--color-background-contrast` | `on-background` | Text on background |
| `--color-outline` | `outline` | Standard border color |
| `--color-outline-variant` | `outline-variant` | Subtle border color |

## Component Aliases

In many components, we still use legacy naming for props (e.g., `accent`, `warn`). These are internally mapped as follows:

- `accent` -> Maps to `secondary` tokens.
- `warn` -> Maps to `error` tokens.

## Implementation Detail

All tokens in the UI Kit components are picked from the `$theme-color-link` map using the `g($t, 'path')` helper. By default, these return the raw Sass values (static CSS) unless the `$use-variables` flag is enabled in `material-map`.
