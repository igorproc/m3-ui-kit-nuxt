import { ICONS } from '#kit/shared/constants/icons'

const DEFAULT_COLLECTION = 'ic'
const OUTLINE_PREFIX = `${DEFAULT_COLLECTION}:outline-`
const FILLED_PREFIX = `${DEFAULT_COLLECTION}:baseline-`
const QUALIFIED_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/

function isIconKey(name: string): name is keyof typeof ICONS {
  return Object.hasOwn(ICONS, name)
}

function qualify(name: string): string {
  if (isIconKey(name)) return ICONS[name]
  if (name.includes(':')) return name

  return `${DEFAULT_COLLECTION}:${name}`
}

export function resolveIconName(name: string, filled = false): string {
  if (!name) return ''

  const qualified = qualify(name)

  if (filled && qualified.startsWith(OUTLINE_PREFIX)) {
    return FILLED_PREFIX + qualified.slice(OUTLINE_PREFIX.length)
  }

  return qualified
}

export function findIconNameProblem(name: string): string | undefined {
  if (!name) {
    return '[m-icon] has no `name`: pass an `ICONS` key (e.g. `home`), a bare `ic` name (e.g. `round-close`) or `collection:name`.'
  }

  if (!QUALIFIED_NAME.test(qualify(name))) {
    return `[m-icon] \`${name}\` is not an icon name: use an \`ICONS\` key, a bare \`ic\` name (e.g. \`round-close\`) or \`collection:name\` in kebab-case.`
  }

  return undefined
}
