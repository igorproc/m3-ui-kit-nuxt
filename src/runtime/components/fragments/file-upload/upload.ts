/**
 * Pure helpers of the upload control: no Vue, no DOM.
 */

/**
 * Splits a file name into the part that may be shortened and the extension
 * that has to stay readable. A dotfile (`.env`) or a name without a dot keeps
 * everything in the stem.
 */
export function splitFileName(name: string): { stem: string, extension: string } {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return { stem: name, extension: '' }
  return { stem: name.slice(0, dot), extension: name.slice(dot) }
}

/**
 * Fills an action name template with the file's name, so two "Retry" buttons
 * in one queue are told apart. A template without `{name}` gets the name after
 * it; no template, no name.
 */
export function actionName(template: string | undefined, fileName: string): string | undefined {
  if (!template) return undefined
  return template.includes('{name}') ? template.replaceAll('{name}', fileName) : `${template} ${fileName}`
}

/**
 * Whether a drag carrying these MIME types is certain to be refused by
 * `accept`. A drag exposes types but not names, so a rule by extension
 * (`.pdf`) cannot be checked until the drop — then the answer is "not certain"
 * and the zone shows the drag as welcome; the drop itself still applies the
 * full policy.
 */
export function dragRefused(accept: string | undefined, types: readonly string[]): boolean {
  const rules = accept?.split(',').map(rule => rule.trim().toLowerCase()).filter(Boolean) ?? []
  if (!rules.length || !types.length || rules.some(rule => rule.startsWith('.'))) return false

  return types.every((raw) => {
    const type = raw.toLowerCase()
    return !rules.some(rule => rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule)
  })
}
