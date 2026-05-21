# Testing Patterns

**Analysis Date:** 2026-05-21

## Test Framework

**Runner:**
- Vitest ^4.1.5 (for unit and component tests)
- Playwright ^1.59.1 (for end-to-end integration and visual regression tests)

**Config:**
- `vitest.config.ts` (defines Nuxt-based test environment using `@nuxt/test-utils/config`)
- Playwright config (if E2E is fully implemented, typically `playwright.config.ts`)

**Assertion Library:**
- Vitest built-in expect (compatible with Jest matchers: `toBe`, `toEqual`, `toContain`, `toHaveBeenCalledWith`)

**Run Commands:**
```bash
npm run test                          # Run all unit/component tests in Vitest
npx vitest --watch                    # Run Vitest in interactive watch mode
npx vitest tests/initial.spec.ts      # Run a specific test file
npm run test:e2e                      # Run Playwright E2E browser tests
```

## Test File Organization

**Location:**
- Dedicated `tests/` directory at the project root holds integration-level and baseline test cases.
- Component-level unit/spec tests are designed to be colocated with component directories (e.g. `app/components/ui/time-picker/*.spec.ts`) or placed in `tests/`.

**Naming:**
- Unit/Component tests: `*.spec.ts`

**Structure:**
```
kit/
├── app/
│   └── components/
│       └── ui/
│           └── time-picker/
│               ├── index.vue
│               └── dial/
│                   └── index.vue
├── tests/
│   └── initial.spec.ts
└── vitest.config.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest'

describe('Initial Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Vue/Nuxt Component Testing Pattern:**
Components can be mounted using `@nuxt/test-utils` or `@vue/test-utils` inside the simulated `'nuxt'` environment:
```typescript
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTimePicker from '../app/components/ui/time-picker/index.vue'

describe('MTimePicker', () => {
  it('renders correctly', async () => {
    const wrapper = await mountSuspended(MTimePicker, {
      props: {
        modelValue: '12:00',
        mode: 'dial',
      }
    })
    expect(wrapper.html()).toContain('ui-time-picker-dial')
  })
})
```

## Mocking

- **DOM Environment:** Mocked using `happy-dom` configured through standard dependency definitions.
- **Vue Composables & Stores:** Pinia and custom composables (like `useThemeStore` or `useTimePicker`) can be mocked or resolved natively within the mounted Nuxt test environment.

## Coverage

- **Target:** No hard gates configured, but Vitest's coverage tool (e.g., using `v8` or `istanbul`) can be invoked using:
  ```bash
  npx vitest run --coverage
  ```

---

*Testing analysis: 2026-05-21*
*Update when test patterns change*
