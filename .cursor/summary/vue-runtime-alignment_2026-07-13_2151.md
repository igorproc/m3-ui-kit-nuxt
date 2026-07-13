# Vue runtime alignment

- Fixed an SSR runtime failure in `docs_v2`: Nitro generated `.output/server/node_modules/vue` from Kit's Vue 3.5.33 copy while the docs renderer used Vue 3.5.39, leaving `vue/server-renderer/index.mjs` unresolved.
- Pinned `kit`'s direct `vue` dependency to `3.5.39` and regenerated `kit/package-lock.json`; all Vue runtime/compiler/server-renderer packages now resolve to 3.5.39.
- Ran `npm install` in `docs_v2`, refreshing its stale lockfile entry for `@primetime/ui-kit` from GitHub to the declared `file:../kit` dependency.
- Verified `npm run build` in both `kit` and `docs_v2`, then started the fresh docs production server and confirmed `GET /` returns HTTP 200.
- Follow-up recommendation: make `vue` and `nuxt` peer dependencies of the published Kit, retain them as dev dependencies for Kit development, and add a consumer SSR smoke test to CI.

## Follow-up implemented

- Moved `vue` and `nuxt` from Kit runtime dependencies to peer dependencies. Kit now develops against pinned `nuxt@4.4.8` and `vue@3.5.39`; a consumer supplies the runtime.
- Pinned `docs_v2` to `nuxt@4.4.8` and `vue@3.5.39`.
- Added `docs_v2` commands: `npm run deps:verify` validates the Kit peer contract and `file:../kit` lockfile source; `npm run test:production` runs that validation, builds, starts Nitro on port 3100, and requires HTTP 200 from `/`.
- Verified `npm run test:production` and `npm run lint` in `docs_v2`.
