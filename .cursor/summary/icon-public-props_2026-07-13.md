# Icon public props normalization

## Changes

- Moved the inline MIcon prop interface to a co-located public `props.ts` definition.
- Added public JSDoc for Iconify name resolution.
- Kept runtime behavior unchanged: `name` remains required and unprefixed names resolve to the `ic` collection.

## Verification

- Consumed successfully by docs_v2 API generation and component tests.
