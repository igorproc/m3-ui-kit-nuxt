import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const componentsRoot = resolve(root, 'src/runtime/components')
// The scan boundary is declared by the published module, not by nuxt.config:
// the kit ships no app of its own, and the test environment boots `src/module`.
const moduleSource = readFileSync(resolve(root, 'src/module.ts'), 'utf8')

function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? collectFiles(path) : [path]
  })
}

describe('component boundaries', () => {
  it('keeps every component inside core, fragments, or ui', () => {
    const componentFiles = collectFiles(componentsRoot)
      .filter(path => path.endsWith('.vue'))
      .map(path => path.slice(componentsRoot.length + 1).replaceAll('\\', '/'))

    expect(componentFiles.length).toBeGreaterThan(0)
    expect(componentFiles.every(path => /^(?:core|fragments|ui)\//.test(path))).toBe(true)
  })

  it('scans only Vue files from the core and public ui boundaries', () => {
    expect(moduleSource).toContain('path: runtime(\'components/core\')')
    expect(moduleSource).toContain('path: runtime(\'components/ui\')')
    expect(moduleSource).not.toMatch(/runtime\('components'\)/)
    expect(moduleSource.match(/extensions: \['vue'\]/g)).toHaveLength(2)
  })

  it('does not expose fragments or TypeScript support files as Nuxt components', () => {
    const declarationsPath = resolve(root, '.nuxt/components.d.ts')

    expect(existsSync(declarationsPath)).toBe(true)

    const declarations = readFileSync(declarationsPath, 'utf8').replaceAll('\\', '/')

    expect(declarations).not.toContain('/src/runtime/components/fragments/')
    expect(declarations).not.toMatch(/src\/runtime\/components\/ui\/.+\/(?:props|types|context)"?\)/)
    expect(declarations).not.toMatch(/export const (?:ColorPickerCanvas|SelectionDataItem|MSliderRoot|MSliderThumb|MTablePagination|MTimePickerDial):/)
    expect(declarations).toMatch(/export const MButton:/)
    expect(declarations).toMatch(/export const MSlider:/)
    expect(declarations).toMatch(/export const CoreScope:/)
  })

  it('does not publish co-located unit tests', () => {
    // The `!src/**` negations in package.json#files are decorative — npm applies
    // negations to what is already included, and `src` never is. The real filter
    // is @nuxt/module-builder excluding specs from its mkdist pattern, so assert
    // on the build output instead of on a string that does nothing.
    const distRoot = resolve(root, 'dist')
    if (!existsSync(distRoot)) {
      return
    }

    const published = collectFiles(distRoot)
      .map(path => path.slice(distRoot.length + 1).replaceAll('\\', '/'))

    expect(published.filter(path => /\.spec\.[cm]?[jt]s$/.test(path) || path.includes('/specs/'))).toEqual([])
  })
})
