export default {
  hooks: {
    // Ship SCSS/CSS as raw source: the consumer's Vite compiles them with the
    // generated ~material-kit-* templates and the #kit alias in scope. mkdist's
    // default sass loader would try to compile them at pack time and fail.
    'mkdist:entry:options'(_ctx: unknown, _entry: unknown, options: { loaders?: string[] }) {
      // Only the 'js' loader: .ts is transpiled and gets .d.ts, while .vue and
      // .scss/.css fall through to a raw copy for the consumer's build to
      // compile. Dropping mkdist's 'vue' loader avoids its declaration crash
      // when vue-tsc isn't installed, without compiling SFCs here.
      options.loaders = ['js']
    },
  },
}
