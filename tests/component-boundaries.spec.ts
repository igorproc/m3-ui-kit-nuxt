import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const componentsRoot = resolve(root, 'app/components')
const nuxtConfig = readFileSync(resolve(root, 'nuxt.config.ts'), 'utf8')
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { files?: string[] }

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
    expect(nuxtConfig).toContain('path: resolve(\'./app/components/core\')')
    expect(nuxtConfig).toContain('path: resolve(\'./app/components/ui\')')
    expect(nuxtConfig).not.toMatch(/resolve\('\.\/app\/components'\)/)
    expect(nuxtConfig.match(/extensions: \['vue'\]/g)).toHaveLength(2)
  })

  it('does not expose fragments or TypeScript support files as Nuxt components', () => {
    const declarationsPath = resolve(root, '.nuxt/components.d.ts')

    expect(existsSync(declarationsPath)).toBe(true)

    const declarations = readFileSync(declarationsPath, 'utf8').replaceAll('\\', '/')

    expect(declarations).not.toContain('/app/components/fragments/')
    expect(declarations).not.toMatch(/app\/components\/ui\/.+\/(?:props|types|context)"?\)/)
    expect(declarations).not.toMatch(/export const (?:ColorPickerCanvas|SelectionDataItem|MSliderRoot|MSliderThumb|MTablePagination|MTimePickerDial):/)
    expect(declarations).toMatch(/export const MButton:/)
    expect(declarations).toMatch(/export const MSlider:/)
    expect(declarations).toMatch(/export const CoreScope:/)
  })

  it('does not publish co-located unit tests', () => {
    expect(packageJson.files).toContain('!app/**/*.spec.ts')
  })
})
