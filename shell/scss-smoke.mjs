/**
 * Compiles every SFC `<style lang="scss">` block in the runtime.
 *
 * Nothing else in the kit's own pipeline does: `nuxt-module-build` copies the
 * runtime verbatim, and Vitest renders in jsdom without a preprocessor. A Sass
 * error therefore reaches the consumer's dev server rather than CI — which is
 * exactly how a mixin called with an argument it does not take once shipped.
 *
 * Mirrors what the module sets up at build time: the abstract prelude is
 * prepended to every entry, `#kit/` resolves to `src/runtime`, and the two
 * generated `~material-kit-*` aliases are stubbed, since their real content is
 * emitted from the consumer's theme config and cannot be known here.
 */
import { readFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import * as sass from 'sass'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runtime = join(root, 'src/runtime')
// The module injects this by absolute path through Vite's resolver; here the
// stylesheet root is on `loadPaths`, which reaches the same file.
const prelude = '@use "additional" as *;\n'

/** Breakpoints normally come from the consumer's `materialKit.breakpoints`. */
const STUBS = {
  '~material-kit-config': '$material-kit-breakpoints: (mobile: 600px, tablet: 905px, desktop: 1240px);',
  '~material-kit-themes': '',
}

/** Sass partial resolution: `foo` may be `foo.scss`, `_foo.scss` or `foo/_index.scss`. */
function resolvePartial(base) {
  const dir = dirname(base)
  const name = base.slice(dir.length + 1)

  const candidates = [
    base,
    `${base}.scss`,
    join(dir, `_${name}`),
    join(dir, `_${name}.scss`),
    join(base, '_index.scss'),
    join(base, 'index.scss'),
  ]

  return candidates.find(candidate => existsSync(candidate) && candidate.endsWith('.scss'))
}

const aliasImporter = {
  // Once a stylesheet is loaded by a custom importer, its relative `@use`s come
  // back here too — Sass will not fall back to the filesystem importer for them.
  canonicalize(url, context) {
    if (url in STUBS) return new URL(`kit-stub:${url}`)

    if (url.startsWith('#kit/')) {
      const found = resolvePartial(join(runtime, url.slice(5)))
      return found ? pathToFileURL(found) : null
    }

    if (context?.containingUrl?.protocol === 'file:') {
      const base = dirname(fileURLToPath(context.containingUrl))
      const found = resolvePartial(resolve(base, url))
      return found ? pathToFileURL(found) : null
    }

    return null
  },
  load(canonical) {
    if (canonical.protocol === 'kit-stub:') {
      return { contents: STUBS[canonical.pathname], syntax: 'scss' }
    }

    return { contents: readFileSync(canonical, 'utf8'), syntax: 'scss' }
  },
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.name.endsWith('.vue')) yield full
  }
}

const STYLE = /<style[^>]*lang="scss"[^>]*>([\s\S]*?)<\/style>/g

let checked = 0
const failures = []

/**
 * Two buckets on one channel. Deprecations fail the check; the legacy-token
 * warnings from `g()` only get counted, because there are ~99 of them and a
 * deprecation printed in that stream is a deprecation nobody reads.
 */
const deprecations = new Map()
const tokenWarnings = new Map()

// A `@warn` raised inside a function carries no span, so the only reliable
// attribution is the entry being compiled when it fired.
let currentFile = 'unknown'

const logger = {
  warn(message, options) {
    const bucket = options?.deprecation ? deprecations : tokenWarnings
    const label = options?.deprecation
      ? `${options.deprecationType?.id ?? 'deprecation'}: ${message.split('\n')[0]}`
      : message.split('\n')[0]

    const seen = bucket.get(label) ?? new Set()
    seen.add(currentFile)
    bucket.set(label, seen)
  },
}

for await (const file of walk(join(runtime, 'components'))) {
  const source = await readFile(file, 'utf8')

  for (const [, css] of source.matchAll(STYLE)) {
    checked += 1
    currentFile = file.slice(root.length + 1)
    try {
      sass.compileString(prelude + css, {
        loadPaths: [join(runtime, 'assets/stylesheet'), runtime],
        importers: [aliasImporter],
        url: pathToFileURL(file),
        // No `quietDeps`: everything here is the kit's own code reached through
        // the custom importer, and Sass counts that as a dependency — silencing
        // it hides deprecations in the very files this check exists to guard.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        logger,
      })
    } catch (error) {
      failures.push({ file: file.slice(root.length + 1), message: error.message })
    }
  }
}

if (failures.length) {
  for (const { file, message } of failures) {
    console.error(`\n✖ ${file}\n${message}`)
  }
  console.error(`\n${failures.length} of ${checked} style blocks failed to compile.`)
  process.exit(1)
}

if (deprecations.size) {
  console.error(`\n${deprecations.size} Sass deprecation(s):`)
  for (const [message, files] of deprecations) {
    console.error(`\n  ${message}\n    ${[...files].join('\n    ')}`)
  }
  console.error('\nDeprecations fail this check: they are warnings today and errors on the next Sass major.')
  process.exit(1)
}

if (tokenWarnings.size) {
  console.log(`\n${tokenWarnings.size} unresolved legacy token path(s) — these rules render nothing:`)
  for (const [message, files] of tokenWarnings) {
    console.log(`\n  ${message}\n    ${[...files].join('\n    ')}`)
  }
  console.log('')
}

console.log(`${checked} style blocks compiled, no deprecations.`)
