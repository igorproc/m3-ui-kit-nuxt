# MAvatar

<identity>
Vuetify reference: `VAvatar` · PrimeTime target: `MAvatar` · Phase: 3 · Type: public
</identity>

<implementation-status state="done" updated="2026-07-16">
Public `MAvatar`, the pure `getAvatarInitials` utility
(`shared/utils/avatar/index.ts`), co-located `avatar/_index.scss` tokens and
focused tests (`tests/avatar.spec.ts`, 19 cases incl. Unicode/RTL initials,
stale-event guard, alt/name labelling) are present; lint and stylelint pass.
The docs_v2 page (content en/ru, token manifest, interactive/playground
renderers) is generated and validated. Note: the `fallback` slot payload is
bound as one object because `name` is reserved on `<slot>`.
</implementation-status>

<status>
Approved without additional product review. The component is a passive identity surface for a person, organization or entity.
</status>

<problem>
Lists, profiles, comments and navigation repeatedly need the same compact identity representation. Raw images do not provide consistent sizing, shape, initials, broken-image fallback or accessibility, while ad-hoc wrappers produce incompatible layouts and colors.
</problem>

<solution>
`MAvatar` renders one fixed-aspect passive surface containing an image, derived initials, an icon or custom content. It owns deterministic fallback behavior and design-system sizing but no interaction, upload, presence, badge or user-profile logic.

Non-goals:

- no click, link, menu or button semantics;
- no image editor, upload or cropping UI;
- no online/presence indicator or notification badge;
- no avatar group/stacking behavior;
- no remote image proxy, retry loop or cache layer;
- no arbitrary numeric size that bypasses the token scale.
</solution>

<api>
```ts
export type MAvatarVariant = 'tonal' | 'filled' | 'outlined'

export interface MAvatarProps {
  src?: string
  alt?: string
  name?: string
  icon?: string
  size?: MSize
  shape?: Extract<MShape, 'full' | 'large' | 'medium' | 'small'>
  variant?: MAvatarVariant
}

const emit = defineEmits<{
  (event: 'load', value: Event): void
  (event: 'error', value: Event): void
}>()
```

Defaults:

```ts
{
  size: 'md',
  shape: 'full',
  variant: 'tonal',
}
```

`size` reuses the canonical `sm | md | lg` taxonomy. `shape` is deliberately restricted to sensible avatar shapes. Consumers needing an interactive avatar wrap it with the appropriate existing button/link component instead of adding interactive props to `MAvatar`.
</api>

<composition>
```text
MAvatar passive root
└── content resolution
    ├── default slot
    ├── native img from src
    └── fallback
        ├── fallback slot
        ├── initials from name
        ├── explicit MIcon
        └── default person MIcon
```

The root reserves its final dimensions before image loading, clips media to the selected shape and never changes size when the source succeeds or fails. `MIcon` is imported explicitly. `MImg` may be adopted later only if it offers useful shared loading/error behavior without making the avatar API image-heavy.
</composition>

<reuse>
Reuse `MIcon`, canonical `MSize`/`MShape` types, shared size prop factory where compatible, theme shape/color/typography tokens and a pure exported initials utility. Do not hardcode identity colors, copy future `MImg` responsive-media behavior or create a global avatar/user registry.
</reuse>

<content-precedence>
1. A provided `default` slot owns the content completely.
2. A non-empty `src` renders the native image while it is valid.
3. Missing or failed `src` enters the same fallback pipeline.
4. A `fallback` slot wins inside that pipeline.
5. A non-empty normalized `name` renders derived initials.
6. An explicit `icon` renders through `MIcon`.
7. Otherwise the default person icon renders.

Changing `src` resets the failed-source state and attempts the new image. A late error from an obsolete source must not replace a newer successfully loaded source; handlers compare the event target/current source with the active prop before updating state.
</content-precedence>

<initials-utility>
Export a pure utility from the avatar family:

```ts
export function getAvatarInitials(
  name: string,
  locale?: string,
): string
```

Rules:

- normalize and trim whitespace;
- split the name into non-empty whitespace-separated words;
- for multiple words use the first grapheme of the first and last words;
- for one word use at most its first two graphemes;
- uppercase with the supplied locale when available;
- return an empty string for an empty normalized name;
- preserve visual character order for RTL scripts rather than reversing initials;
- cap output at two grapheme clusters, not two UTF-16 code units.

The implementation uses `Intl.Segmenter` when available with a documented Unicode-safe fallback. Unit tests lock SSR/client parity for supported project runtimes. The utility contains no component or reactive state.
</initials-utility>

<slots>
- `default`: replaces all built-in image/fallback rendering.
- `fallback`: replaces only the missing/failed image fallback.

```ts
export interface MAvatarDefaultSlot {
  size: MSize
  failed: boolean
}

export interface MAvatarFallbackSlot {
  name: string | undefined
  initials: string
  icon: string
  error: Event | undefined
}
```

Custom slot content remains clipped and centered by the semantic avatar surface. Slots do not receive raw internal mutation functions.
</slots>

<image-lifecycle>
The image uses native loading and decoding behavior; no mounted-time fetch is introduced. On native `load`, clear the relevant failure state and emit `load`. On native `error`, store the event for the fallback slot, switch to fallback and emit `error` once for that source.

There is no automatic retry because repeatedly failing identity URLs can create request loops. A consumer retries by supplying a changed `src`. Empty `src` enters fallback without emitting a synthetic error.
</image-lifecycle>

<accessibility>
- If `alt` is a non-empty explicit string, the native image carries that alternative text.
- If `alt=""`, the image is explicitly decorative.
- If `alt` is omitted and `name` exists, the avatar root exposes the normalized name as its accessible label while the nested image/icon remains decorative.
- If neither `alt` nor `name` exists, built-in image/icon content is decorative and does not announce filenames or icon names.
- Initials are visual fallback; assistive technology receives the full name, not the abbreviated letters.
- A custom default slot owns the semantics of its custom content; the root still must not introduce interactive roles.

The avatar is not focusable. Consumers wrap it with `MButton`, `MButtonIcon`, `NuxtLink` or another semantically correct control when it triggers an action.
</accessibility>

<styles>
Create `app/assets/stylesheet/components/avatar/_index.scss` exporting a single nested `$tokens` map consumed with `material-map()` and `g()`.

The map includes:

- `sm`, `md`, `lg` inline/block sizes;
- supported shape values from the system shape map;
- per-variant container, content and outline roles;
- initials typography per size;
- icon size per avatar size;
- image object-fit and content alignment values where tokens are required;
- optional loading transition motion without layout changes.

The root uses equal inline/block dimensions and `overflow: hidden`; image content fills the box with cover behavior. There are no hover/pressed/focus state layers because the avatar is passive. Interactive state belongs to the wrapping control. The SFC contains no literal component colors, sizes, shape radii or runtime component-state CSS variables.
</styles>

<ssr-and-reactivity>
SSR renders deterministic dimensions and the current content branch. No browser API or `onMounted` is needed for initial data. Source failure exists only after a native client event; hydration begins from the same source/fallback decision derived from props. Watches reset only source-specific failure state and have no global listeners or cleanup requirements.
</ssr-and-reactivity>

<dx>
```vue
<MAvatar
  src="/people/ada.webp"
  name="Ada Lovelace"
/>
```

```vue
<MAvatar
  name="Grace Hopper"
  size="lg"
  variant="outlined"
/>
```

```vue
<MButtonIcon aria-label="Открыть профиль">
  <MAvatar
    src="/people/lin.webp"
    name="Lin Chen"
    size="sm"
  />
</MButtonIcon>
```

```vue
<MAvatar name="PrimeTime">
  <template #fallback="{ initials }">
    <BrandMonogram :label="initials" />
  </template>
</MAvatar>
```
</dx>

<edge-cases>
- whitespace-only name falls through to icon;
- single-word, multi-word, hyphenated, emoji and RTL names produce bounded initials;
- broken source and missing source share visual fallback but only a real error emits `error`;
- changing a failed source retries only the new URL;
- stale load/error events cannot overwrite state for the active URL;
- very wide/tall images remain cover-clipped without layout shift;
- custom content cannot expand the fixed avatar box;
- `alt`, `name` and decorative cases never create duplicate accessible names.
</edge-cases>

<tests>
- default props and each size/shape/variant token branch;
- successful image load and emitted native event;
- failed source fallback and one error emission per source;
- source replacement after failure and stale-event protection;
- content precedence for default/fallback/image/initials/icon/default icon;
- initials utility for empty, single, multi-word, Unicode and RTL input;
- explicit alt, empty alt, name-derived label and decorative behavior;
- fixed dimensions and image cover behavior;
- SSR markup and hydration for image and fallback branches;
- light/dark themes, lint, stylelint and docs playground examples.
</tests>

<done>
`MAvatar` provides a small, passive and accessible identity surface with deterministic image fallback, initials and icon rendering. It reuses canonical tokens/types, introduces no user-domain assumptions and passes lint, stylelint, unit, accessibility and SSR checks.
</done>

<questions>
None.
</questions>
