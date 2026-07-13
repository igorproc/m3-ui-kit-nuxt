# MRating

<identity>Vuetify: `VRating` · Target: `MRating` · Phase: 2 · Type: public numeric visual control</identity>

<implementation-status state="done" updated="2026-07-14">
Public single-tab-stop slider control, shared range keyboard controller,
fractional clipping, pointer preview, focused tests and docs are present.
</implementation-status>

<problem>Rating требует pointer preview, fractional selection, keyboard editing и readonly display. Набор отдельных star buttons создаёт много tab stops и особенно плохо масштабируется при half/quarter steps.</problem>

<user-jobs>
- Выбрать оценку pointer/touch.
- Предварительно увидеть значение при hover без commit.
- Изменить значение клавиатурой после focus control.
- Показать readonly aggregate rating.
- Заменить stars на MIcon/MShape/custom artwork.
</user-jobs>

<solution>Один focusable slider-like control владеет number model; visual items aria-hidden/presentation и вычисляют fractional fill. Range/step/keyboard math переиспользует shared slider foundation, но MSlider DOM/styles не копируются.</solution>

<models>
```ts
const model = defineModel<number>({ default: 0 })
const focused = defineModel<boolean>('focused', { default: false })
```

Model finite, normalized to step и clamp `0…length`. Updates только defineModel.
</models>

<api>
```ts
interface MRatingProps {
  length?: number
  step?: number
  clearable?: boolean
  readonly?: boolean
  disabled?: boolean
  icon?: string
  emptyIcon?: string
  color?: MColor
  name?: string
  ariaLabel?: string
}
```

Defaults: `length:5`, `step:1`, `clearable:false`, star/star-outline icons. Отдельный max не нужен: length является visual count и maximum.
</api>

<semantics>
Interactive root:

```html
role="slider"
tabindex="0"
aria-valuemin="0"
aria-valuemax="5"
aria-valuenow="3.5"
aria-valuetext="3,5 из 5"
```

Icons не являются buttons/tab stops. Readonly root не focusable и получает aggregate accessible description; disabled slider удалён из tab order согласно shared policy.
</semantics>

<keyboard-boundary>
Keyboard actions работают только при focus root через локальный `@keydown`. Global `useHotkey` не используется: он предназначен для window-level application shortcuts и не должен перехватывать arrows вне rating.

Общая pure/lifecycle-free utility:

```ts
createRangeKeyboardController({
  min: 0,
  max: () => props.length,
  step: () => props.step,
  getValue: () => model.value,
  setValue: commit,
})
```

Её переиспользуют MSlider/MRating и подходящие parts MNumberInput. Handler вызывается только из DOM widget.
</keyboard-boundary>

<keyboard>
- ArrowRight/ArrowUp → +step;
- ArrowLeft/ArrowDown → -step;
- RTL меняет horizontal arrows, vertical остаются;
- Home → 0;
- End → length;
- PageUp/PageDown → larger step (default step×10, clamped);
- Enter/Space не нужны для slider commit;
- handled keys preventDefault, остальные не перехватываются;
- readonly/disabled no mutation.
</keyboard>

<fractional-rendering>
Каждый item имеет empty layer и full layer, clipped по fill `0…1`. Поэтому step поддерживает 1, 0.5, 0.25 без отдельного halfIcon.

```ts
interface RatingItemSlot {
  index: number
  value: number
  fill: number
  active: boolean
  preview: boolean
  disabled: boolean
}
```

`#item` позволяет MIcon/MShape/SVG. Custom content остаётся presentation; interaction root общий.
</fractional-rendering>

<pointer>
- hover computes preview from pointer x and step without model update;
- pointer leave restores committed rendering;
- click/pointerup commits preview;
- touch commits directly without sticky hover;
- pointer coordinate uses root rect, item count, step and RTL;
- movement clamp; pointer lifecycle cleanup through scope helpers;
- disabled/readonly do not preview/commit.
</pointer>

<clear-policy>
Zero — valid model. Default clearable false: repeated click same value does nothing; Home can still set zero as slider boundary. With clearable true repeated pointer commit of exact current value resets zero. Keyboard decrement/Home remain ordinary range actions.
</clear-policy>

<events>
```ts
interface MRatingEmits {
  (event: 'change', value: number): void
  (event: 'preview', value: number | null): void
}
```

Change emitted on committed pointer/keyboard change, not hover.
</events>

<validation-a11y>
Label/value text localized and can be overridden via ariaLabel/outer label composition. Color/icon are not only signals; screen reader hears numeric value. Hidden native input with name may mirror normalized model for plain form submission if required by kit form policy, without becoming a second focus target.
</validation-a11y>

<m3-ux>
Active/inactive icons use semantic color roles, hover preview distinct from committed selection, focus indicator surrounds whole control, disabled emphasis follows M3. Touch target applies to item geometry while tab focus remains single. Reduced motion removes fill animation but keeps immediate state.
</m3-ux>

<styles>
Nested map: container gap/focus, item touch size, icon size, active/inactive/preview/disabled colors, fractional clip transition. Slot content inherits currentColor. `material-map()`/`g()`, `1rem=1px макета`, no literal state values.
</styles>

<reuse>Shared `createRangeKeyboardController/createSlider` math, MIcon defaults, MShape/custom slot, color/shape/motion tokens. Не использовать global useHotkey, per-star store, MButton per icon или duplicate slider CSS.</reuse>

<edge-cases>
- invalid length/step/model → dev warning and safe normalization;
- step not evenly dividing length;
- external fractional model;
- RTL pointer/horizontal keyboard;
- pointer leaves during active press;
- model changes while hover preview active: preview remains visual until leave, next commit uses pointer value;
- readonly rating with zero;
- quarter fill custom icons.
</edge-cases>

<tests>defineModel normalization; single tab stop/slider aria; local focus-only keyboard and no global listener; shared range controller; Home/End/Page/arrows/RTL; pointer hover/commit/touch/leave; fractional clipping; clearable; readonly/disabled; item MIcon/MShape slot; invalid props; reduced motion/SSR.</tests>

<done>MRating предоставляет один доступный numeric control с focus-local keyboard, pointer preview и arbitrary fractional visuals, переиспользуя range math без global hotkeys или per-icon controls.</done>

<questions></questions>
