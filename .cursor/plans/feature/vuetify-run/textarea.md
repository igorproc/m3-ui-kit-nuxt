# MTextarea

<identity>
Vuetify: `VTextarea` · Target: `MTextarea` · Phase: 2 · Type: public multiline field
</identity>

<problem>
`MTextField` рендерит однострочный native input. Многострочный ввод имеет отдельные native semantics и UX: rows, wrapping, resize, auto-grow, max rows, counter и внутренний scroll. `type="textarea"` скрыл бы эти различия и перегрузил API text field.
</problem>

<solution>
Создать отдельный public `MTextarea`, но не копировать field chrome. `MTextField` и `MTextarea` используют общую private field foundation для container/label/icons/supporting text/states; textarea добавляет только multiline behavior и tokens.
</solution>

<composition>
```text
private MField
├── label
├── filled/outlined container
├── prepend/append
├── focus/populated/error/disabled states
├── helper/error messages and ids
└── shared M3 field tokens

MTextField → native input
MTextarea  → native textarea + rows/autogrow/resize/counter
```

Private `MField` не становится public API на этом этапе. Extraction выполняется совместно с update `MTextField`, сохраняя его текущий public contract.
</composition>

<models>
Только Vue `defineModel`:

```ts
const model = defineModel<string>({ default: '' })
const focused = defineModel<boolean>('focused', { default: false })
```

Ручные `update:modelValue`/`update:focused` emits не объявляются.
</models>

<api>
```ts
type TextareaResize = 'vertical' | 'horizontal' | 'both'

interface MTextareaProps {
  label?: string
  placeholder?: string
  helperText?: string
  variant?: 'filled' | 'outlined'

  disabled?: boolean
  readonly?: boolean
  required?: boolean
  path?: string
  name?: string

  error?: boolean
  errorMessage?: string

  rows?: number
  maxRows?: number
  autoGrow?: boolean
  resize?: TextareaResize

  maxlength?: number
  counter?: boolean | number

  autocomplete?: string
  autofocus?: boolean
  spellcheck?: boolean
  wrap?: 'soft' | 'hard' | 'off'
}
```

Defaults:

- `rows: 3`;
- `autoGrow: false`;
- `resize: undefined` — resize выключен, отдельный `none/noResize` prop не нужен;
- `counter: false`.
</api>

<primary-dx>
```vue
<MTextarea
  v-model="description"
  label="Описание"
  helper-text="Расскажите о проекте"
  :rows="4"
/>
```
</primary-dx>

<resize-policy>
`resize` — опциональная capability:

```vue
<MTextarea resize="vertical" />
<MTextarea resize="horizontal" />
<MTextarea resize="both" />
```

Без prop применяется `resize: none`. При `autoGrow=true` component управляет block height; переданный `resize` игнорируется с dev warning. Не пытаться сочетать manual resize и autogrow: следующий input иначе перезапишет выбор пользователя.
</resize-policy>

<counter>
Counter и native restriction независимы:

```vue
<MTextarea :maxlength="500" counter />
```

Показывает `138 / 500` и ограничивает native input.

```vue
<MTextarea :counter="1000" />
```

Показывает `138 / 1000`, но не ограничивает ввод без `maxlength`.

Rules:

- `counter === true` берёт display limit из `maxlength`;
- numeric `counter` задаёт только display limit;
- `counter === true` без maxlength показывает текущую длину;
- `maxlength` всегда остаётся native attribute;
- первая версия считает `model.length` (UTF-16 code units), чтобы counter совпадал с native maxlength; grapheme mode откладывается до согласованного input limiting API.
</counter>

<auto-grow>
```vue
<MTextarea
  v-model="message"
  auto-grow
  :rows="2"
  :max-rows="8"
/>
```

- начальная min height соответствует `rows`;
- grows/shrinks при user и programmatic model changes;
- после `maxRows` включается internal vertical scroll;
- ниже `rows` не уменьшается;
- width/font/token changes пересчитывают wrapping;
- `maxRows` используется только с autoGrow; `rows >= 1`, `maxRows >= rows`, invalid combinations дают dev warning.
</auto-grow>

<auto-grow-implementation>
Предпочтительный fallback — скрытый mirror element с теми же width, font, line-height, padding, border и wrapping. Mirror скрыт от accessibility и определяет declarative content height без постоянной imperative записи `style.height`.

Перед реализацией сделать compatibility prototype CSS `field-sizing: content`. Если browser baseline kit достаточен, использовать progressive enhancement; mirror остаётся fallback. Никаких raw ResizeObserver/listener без lifecycle cleanup.
</auto-grow-implementation>

<slots>
```ts
interface MTextareaSlots {
  prepend(): unknown
  append(): unknown
  helper(props: { helperText?: string }): unknown
  error(props: { message?: string }): unknown
  counter(props: {
    length: number
    maxlength?: number
    remaining?: number
  }): unknown
}
```

Не добавлять второй набор inner icon slots до доказанного layout scenario. Default counter/helper/error полностью доступны без slots.
</slots>

<validation>
Первая версия переиспользует текущие `useTextField/useField` и shared field ids. Pending validation architecture находится в `feature/pendind-components/validation.md`; `MTextarea` не зависит от её решения и мигрирует вместе с `MTextField` позднее.
</validation>

<native-a11y>
- настоящий `<textarea>`, без перехвата Enter/arrows/selection/copy/paste;
- helper/error/counter ids объединяются в `aria-describedby`;
- `aria-invalid` следует текущему shared field validation contract;
- counter не становится noisy live region и по умолчанию скрывается от повторного screen-reader чтения, если limit уже описан control;
- disabled и readonly сохраняют разные native semantics;
- label связан через stable `for/id`.
</native-a11y>

<m3-ux>
Переиспользуются filled/outlined surface, label, supporting text, focus/error/disabled roles и typography `MTextField`. Textarea-own tokens: min block size, vertical alignment, content padding, resize affordance, mirror, counter layout и scrollbar. Reduced motion применяется к size/label transitions.
</m3-ux>

<styles>
Shared field `$tokens` map извлекается без копирования. Co-located textarea map содержит только multiline branches:

```scss
$tokens: (
  md-textarea: (
    container: (...),
    input: (...),
    mirror: (...),
    counter: (...),
    scrollbar: (...),
  ),
);
```

Все values через `material-map()`/`g()`, nested declaration, `1rem = 1px макета`; никаких literal sizes/colors и component-state runtime variables в SFC.
</styles>

<reuse>
Private field chrome extracted from `MTextField`, existing `useTextField/useField`, label/helper/error rendering and text-field token roles. Не форкать полный text-field template/styles и не создавать validation engine.
</reuse>

<tests>
- defineModel value/focused;
- native rows/wrap/readonly/disabled/name/autocomplete;
- optional resize absent/vertical/horizontal/both;
- autoGrow min/max/shrink/programmatic/width changes;
- autoGrow + resize warning;
- counter boolean/numeric/maxlength and counter slot;
- label/helper/error/counter ARIA ids;
- shared filled/outlined/error/focus states;
- SSR stable rows height/hydration;
- mirror/observer/timer scope cleanup.
</tests>

<done>
Multiline input получает самостоятельный native-friendly API, declarative auto-grow/counter и M3 appearance без перегрузки `MTextField` и без копирования field chrome.
</done>

<questions></questions>
