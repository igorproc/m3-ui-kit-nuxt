# Codebase Structure

**Analysis Date:** 2026-05-21

## Directory Layout

```
kit/
├── .agent/                  # GSD execution states, hooks, and subagent skills
│   ├── agents/              # Custom specialized subagent logic specifications
│   ├── get-shit-done/       # Core workflow definitions, templates, and references
│   │   ├── templates/       # Predefined blueprints for project documentation
│   │   └── workflows/       # Multi-step command action routines
│   └── skills/              # Individual skill instruction files (SKILL.md)
├── app/                     # Primary Nuxt 4 application workspace
│   ├── assets/              # SASS stylesheets, token mappings, and theme styles
│   │   └── stylesheet/      # Zero-Runtime style structure (abstracts, components)
│   ├── components/          # Vue component library base
│   │   └── ui/              # M3 globally imported UI components (e.g. time-picker/, toolbar/)
│   ├── composables/         # Custom functional hooks (useTimePicker, useBreakpoint)
│   ├── layouts/             # Grid layouts, main application frames
│   ├── modules/             # Nuxt compiler extension modules (kit/module.ts)
│   ├── pages/               # Visual onboarding pages and playground route handlers
│   ├── plugins/             # Framework startup integrations
│   └── store/               # Pinia stores (theme, windowSize, dialog)
├── shared/                  # Common TypeScript constants and models
│   ├── constants/           # Cookie, layout, and theme key constants
│   ├── types/               # Type schemas, configuration types
│   └── utils/               # Common string and color utility functions
├── tests/                   # Standard validation tests
├── package.json             # NPM package descriptor and configuration
└── nuxt.config.ts           # Central framework configuration file
```

## Directory Purposes

**app/assets/stylesheet/**
- Purpose: Zero-Runtime styling foundation. Includes abstracts (variables, functions, mixins) and individual component styles.
- Contains: SASS modules (`*.scss`).
- Key files: `abstracts/_functions.scss` (custom deep token map helpers like `g()`), `themes/index.scss` (aliases mapping system parameters to dynamic classes).

**app/components/ui/**
- Purpose: Pre-built modular Material Design 3 interactive components.
- Contains: Individual Vue SFC folders containing `index.vue` and sub-assets.
- Key files: `time-picker/index.vue` (root picker matching active modes), `time-picker/dial/index.vue` (trigonometry-based drag-dial).

**app/composables/**
- Purpose: Decoupled client utilities and reactive listeners.
- Contains: TypeScript hooks (`*.ts`).
- Key files: `time/useTimePicker.ts` (time coordinate calculation states).

**app/store/**
- Purpose: Application-wide shared state.
- Contains: Pinia stores (`*.ts`).
- Key files: `theme.ts` (injects class attributes onto HTML via cookie values).

**shared/**
- Purpose: Common interfaces standardizing interactions between client components and compiler modules.
- Contains: TypeScript modules (`*.ts`).
- Key files: `shared/constants/theme.ts` (lists allowed contrast levels).

## Key File Locations

**Entry Points:**
- `app/app.vue` - Client application bootstrap.
- `nuxt.config.ts` - Compiler baseline config, module aliases, and Vite styling additions.

**Configuration:**
- `tsconfig.json` - TS compiler flags.
- `eslint.config.mjs` - Linter patterns.
- `.stylelintrc.js` - SASS rules and code formatting style guidelines.
- `vitest.config.ts` - Unit testing settings.

**Testing:**
- `tests/initial.spec.ts` - Vitest initial baseline unit tests.

## Naming Conventions

**Files:**
- `PascalCase.vue`: Subcomponents within component subfolders.
- `index.vue`: Main directory component files.
- `kebab-case.scss`: SCSS stylesheet modules.
- `kebab-case.ts`: Composables, constants, and utilities.
- `*.spec.ts`: Test specifications.

**Directories:**
- `kebab-case`: General system directories.
- `plural names`: Folders representing collections of modules (e.g. `composables/`, `plugins/`, `assets/`).

## Where to Add New Code

**New UI Component:**
- Implementation: `app/components/ui/[component-name]/index.vue`
- Stylesheet: `app/assets/stylesheet/components/_[component-name].scss` (import in `main.scss`)
- Test Case: `tests/[component-name].spec.ts`

**New App State Store:**
- Implementation: `app/store/[store-name].ts`
- Usage: Dynamic auto-import is registered globally.

**New Shared Constants:**
- Implementation: `shared/constants/[domain].ts`
- Usage: Resolves inside both client code and local compiler modules.

---

*Structure analysis: 2026-05-21*
*Update when directory structure changes*
```
