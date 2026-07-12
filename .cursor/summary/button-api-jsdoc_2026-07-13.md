# Button API JSDoc normalization

## Changes

- Added property-level public JSDoc to shared color, variant, disabled, and loading prop definitions.
- Added property-level public JSDoc to Button tag, native type, and Nuxt destination props.
- These comments are now consumed by the docs_v2 build-time API generator as the technical source of truth.

## Verification

- Kit ESLint passed with 0 errors; 10 pre-existing warnings remain in unrelated files.
