# Fields: fieldset notch, axis custom properties, flat state cascade

Scope: `MTextField`, `MNumberInput`, `MTextarea`, `MOtpInput` (styles + token maps).
`fragments/field/root.vue` still uses the old surface patch and the old
`text-field` tokens `outlined.label.{bg,padding,margin}` — kept for it.

## Outlined notch without a surface patch
- The raised label used to sit on a `surface`-coloured patch, which broke on any
  other background. Outlined fields now render
  `<fieldset class="…__outline" aria-hidden><legend class="…__notch"><span class="…__notch-text">`
  inside the control; the hidden legend holds the label text (plus ` *` when
  `required`) at the raised font size, so the browser cuts the border. Pure CSS,
  correct in SSR HTML, nothing measured.
- text-field: control keeps its transparent 1rem border; fieldset `inset: -1rem`.
- number-input / textarea: the control has `overflow: hidden` (zones, state layer,
  footer), so outlined trades its border for `padding` of the same width
  (`outlined.frame`) and the fieldset sits at `inset: 0` with
  `border-color: inherit` — state rules keep writing the control's `border-color`.
- Legend height = border width, so the fieldset never shifts its top edge.

## Axes as private custom properties
- `density` and `rounded` modifiers only set `--ui-<block>-*` values
  (height, label top, raised transforms, input padding, zone sizes, radius).
  Every rule reads them once — no density × placement × variant selector matrix.
- Derived values live in the token maps (`density-step()` functions,
  `label.max-width`, `outlined.inset`, `outlined.outline.padding.start`,
  `outlined.notch.font-size`, textarea `growth.*`, `grip.body.padding.bottom`).
- `--ui-<block>-inset` = content start. Outlined: `max(16rem, min(radius, height/2) + 4rem)`
  so on `large`/`pill` corners the content and notch clear the curve.
  Textarea caps the radius at the default box (48rem) — its height is not
  readable at the root; a very tall pill textarea can still put the notch on the arc.

## Label with a leading zone
- text-field `prepend` / number-input `split`: resting label stays past the zone
  (52rem / 60rem, a contract — prepend is sized for a 24rem icon); raised onto
  the border it returns to the content start via
  `translateX(var(--ui-<block>-label-notch-shift, 0))`, so the notch never depends
  on what a prepend holds.

## State cascade
- text-field state moved from `data-*` to BEM modifiers
  (`--focused/--populated/--error/--disabled/--prepend/--append`), per
  `docs/system/*/craft.md`. Specs updated (incl. `dropdown/tests/variants.spec.ts`).
- Each shape has its own block, states ascending (base → hover → focused → error
  → disabled), equal weight. number-input/textarea gate hover/focus with
  `:where(.…--interactive)` so the gate adds no weight. No `:not()` variant
  exclusions, no `>` combinators (text-field got `__row` and `__leading` classes
  for the two places `>` did real work).
- Behaviour fixes agreed with the user: filled text-field label turns primary on
  focus (the old rule targeted a label inside the control — dead); error beats
  focus for label/border colour in all three fields; outlined disabled
  text-field input/icon use their own `outlined.disabled.*` tokens.
- Kept on purpose: filled text-field error/disabled colour the whole frame, not
  only the bottom rule.

## Known leftovers
- number-input `scrub` + `filled` + overlay placement still pads the value for a
  label that is not rendered (`&--scrub &__input` loses to the filled padding rule)
  — pre-existing, reported, not changed.
- `fragments/field/root.vue` still has the surface patch.
- Visual check pending from the user (docs_v2 after `npm run build`).
