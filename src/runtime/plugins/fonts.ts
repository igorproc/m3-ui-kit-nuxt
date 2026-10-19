import { defineNuxtPlugin, useHead, useRuntimeConfig } from '#imports'
import { buildFontLinks } from '#kit/utils/typography/buildFontLinks'
import type { ResolvedTypography } from '#kit/utils/typography/resolveTypography'

/**
 * Puts the configured font stylesheets into the document head. There the browser
 * finds them while parsing the HTML, instead of only after the kit's own CSS has
 * downloaded — which is when an `@import` inside that CSS would be seen.
 */
export default defineNuxtPlugin({
  name: 'material-fonts',
  setup() {
    // The module writes the resolved typography; generated runtime-config types do not know that.
    const config = useRuntimeConfig().public.materialKit as { typography: ResolvedTypography }
    const { fonts } = config.typography

    if (fonts.length) useHead({ link: buildFontLinks(fonts) })
  },
})
