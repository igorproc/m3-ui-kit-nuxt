# External Integrations

**Analysis Date:** 2026-05-21

## APIs & External Services

**Theme Palettes Generation:**
- Material Color Utilities (`@material/material-color-utilities`) - Generates dynamic M3 theme palettes directly from source hex colors.
  - SDK/Client: `@material/material-color-utilities` package ^0.4.0
  - Auth: None (pure local algorithmic generation)
  - Endpoints used: `themeFromSourceColor`, `argbFromHex`, `hexFromArgb` used at Nuxt module compilation to generate CSS variables.

**Icon Injection:**
- Iconify Server Bundle (`@nuxt/icon` + `@iconify-json/ic`) - Service-based SVG vector icon collection rendering.
  - SDK/Client: `@nuxt/icon` module ^2.2.1
  - Auth: None
  - Collection: `ic` (Material Design icons) bundled server-side for self-hosted icon loading.

**Device & Platform Context:**
- Browser User-Agent Detection (`@nuxtjs/device`) - Used to determine screen/browser capabilities before rendering.
  - SDK/Client: `@nuxtjs/device` package ^4.0.0
  - Auth: None (local middleware parser)

## Data Storage & Persistence

**State Management & Theme Persistence:**
- Browser Cookies (`nuxt` cookie system) - Stores user theme preferences (`definition`, `contrast`, `pallet`) for seamless Server-Side Rendering (SSR) styling injection.
  - Implementation: `useCookie` composable mapped in Pinia store
  - Key names: `theme-definition` (for light/dark mode), `theme-pallete` (for active palette, fallback `_m3-fallback`), and `theme-contrast` (for high/medium contrast)
  - Lifespan / Security: Standard browser cookies, injected as HTML attributes (`data-definition`, `data-pallet`, `data-contrast`) in HTML header to avoid style flashes.

**Global Application State:**
- Pinia Store (`@pinia/nuxt` + `pinia`) - Manages dynamic reactive client state.
  - Client: `pinia` ^3.0.4, `@pinia/nuxt` ^0.11.3
  - Core stores: `themeStore` (theme and palette definition state), `dialogStore` (active overlay states), `windowSizeStore` (responsive width/height layout states for SSR).

## Monitoring & Observability

- **None:** The UI kit is a client library; error logging and analytics are designed to be integrated by the host application.

## CI/CD & Deployment

**CI Pipeline:**
- **None:** Manual test runners configured locally (`vitest`, `playwright`). (Host setup could implement standard GitHub Actions runner for `npm run test` and `npm run lint`).

---

*Integration audit: 2026-05-21*
*Update when adding/removing external services*
