export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue/scss',
  ],
  plugins: [
    'stylelint-scss',
  ],
  rules: {
    'at-rule-no-unknown': null,
    'media-query-no-invalid': null,
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': '^-?[a-z][a-z0-9]*(--?[a-z0-9]+)*$',
    'scss/no-global-function-names': true,
    'scss/selector-no-redundant-nesting-selector': true,
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*(__[a-z0-9]+)?(--[a-z0-9]+)?$',
      {
        message: 'Expected class selector to be kebab-case or BEM',
      },
    ],
  },
}
