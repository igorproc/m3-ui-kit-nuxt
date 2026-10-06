export default {
  hooks: {
    // Ship SCSS/CSS as raw source: the consumer's Vite compiles them with the
    // generated ~material-kit-* templates and the #kit alias in scope. mkdist's
    // default sass loader would try to compile them at pack time and fail.
    'mkdist:entry:options'(_ctx: unknown, _entry: unknown, options: { loaders?: string[] }) {
      // 'js' transpiles .ts and emits .d.ts. 'vue' strips TypeScript from SFC
      // scripts/templates and, through vue-tsc, emits `index.d.vue.ts` next to
      // each SFC — without it a consumer's TypeScript cannot see component
      // props at all (they resolve to nothing). Style blocks are left raw; no
      // sass/postcss loader here, so .scss/.css stay source for the consumer.
      options.loaders = ['js', 'vue']
    },
  },
}
