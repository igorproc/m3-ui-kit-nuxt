# Validation API: pending architecture decision

<identity>
Status: pending discussion · Vuetify reference: `VValidation` · Existing kit: `useField`, `useFormBuilder`, `useFormSchema`, VeeValidate · Candidate public target: renderless `MValidation`
</identity>

<reason-for-pending>
В kit уже существует validation pipeline, поэтому добавление нового `useValidation` может стать лишним facade без самостоятельной ценности. Нужно отдельно решить, достаточно ли расширить canonical `useField`, и нужен ли custom-control consumers публичный renderless `MValidation`.
</reason-for-pending>

<existing-system>
```text
useFormSchema
    ↓ descriptor → Yup schema
useFormBuilder
    ↓ VeeValidate form context
useField
    ↓ component model bridge
MTextField / MCheckbox / MRadio / ...
```

Новая реализация обязана переиспользовать эту систему. Второй validation engine, Pinia store или параллельный form context запрещены.
</existing-system>

<current-gaps>
Текущий `useField` возвращает только `errorMessage`, `hasError` и `meta`. Не хватает manual validate/reset/touched API, нескольких ошибок, external/server errors, async pending state, общей trigger/display policy и полноценного standalone field режима.
</current-gaps>

<variant id="use-field-update">
## Вариант A: только расширить `useField`

```ts
interface UseFieldOptions<T> {
  path?: MaybeRefOrGetter<string | undefined>
  model: Ref<T>
  rules?: ValidationRule<T>[]
  externalErrors?: MaybeRefOrGetter<string[]>
  validateOn?: ValidationTrigger[]
  showErrorsOn?: ErrorDisplayTrigger[]
}

interface UseFieldReturn<T> {
  value: Ref<T>
  errors: Readonly<ComputedRef<string[]>>
  errorMessage: Readonly<ComputedRef<string | undefined>>
  hasError: Readonly<ComputedRef<boolean>>
  shouldShowErrors: Readonly<ComputedRef<boolean>>
  isDirty: Readonly<ComputedRef<boolean>>
  isTouched: Readonly<ComputedRef<boolean>>
  isValid: Readonly<ComputedRef<boolean>>
  isPending: Readonly<ComputedRef<boolean>>
  isValidated: Readonly<ComputedRef<boolean>>
  validate: () => Promise<FieldValidationResult>
  reset: (value?: T) => void
  setTouched: (touched?: boolean) => void
  setErrors: (errors: string[]) => void
  onInput: () => void
  onChange: () => void
  onBlur: () => void
}
```

Плюсы: один canonical adapter, минимальный public surface, удобно для внутренних M-controls.

Минусы: custom template control требует setup/ref ceremony и напрямую использует composable.
</variant>

<variant id="renderless-validation">
## Вариант B: `useField` update + public renderless `MValidation`

```vue
<MValidation
  v-model="rating"
  name="rating"
  :rules="[required(), min(1)]"
>
  <template #default="field">
    <CustomRating
      :model-value="field.value"
      :invalid="field.shouldShowErrors"
      :pending="field.isPending"
      @update:model-value="field.setValue"
      @blur="field.onBlur"
    />

    <MMessages
      v-if="field.shouldShowErrors"
      :messages="field.errors"
    />
  </template>
</MValidation>
```

`MValidation` не создаёт DOM, rules engine или store. Он только выводит reactive `useField` state/actions в typed slot.

Плюсы: template-first escape hatch для custom controls, закрывает роль `VValidation`, скрывает VeeValidate.

Минусы: ещё одна public сущность; нужно не дублировать обязанности существующих field components.
</variant>

<candidate-api>
```ts
type ValidationTrigger = 'input' | 'change' | 'blur' | 'submit'
type ErrorDisplayTrigger = 'dirty' | 'touched' | 'validated' | 'submit' | 'always'

interface MValidationProps<T> {
  modelValue: T
  name?: string
  rules?: ValidationRule<T>[]
  externalErrors?: string[]
  validateOn?: ValidationTrigger[]
  showErrorsOn?: ErrorDisplayTrigger[]
  disabled?: boolean
  readonly?: boolean
}
```
</candidate-api>

<trigger-policy>
Предлагаемый UX default:

```ts
validateOn: ['blur', 'change']
showErrorsOn: ['touched', 'submit']
```

Untouched field не показывает ошибку. После первой invalid validation input может eager-перевалидировать значение, чтобы ошибка исчезала сразу после исправления. Submit показывает все ошибки.
</trigger-policy>

<standalone-vs-form>
- С `name/path` field регистрируется в ближайшем VeeValidate form context.
- Без path rules могут работать standalone, но поле не участвует в form submit aggregation.
- Нужно проверить, стоит ли path оставлять setup-static или сделать reactive с безопасной re-registration.
</standalone-vs-form>

<external-errors>
Разделять client и server errors. После изменения значения wrapper не мутирует входной prop, а emits `clear:external-errors`; consumer решает, когда удалить устаревшую server error.
</external-errors>

<a11y-ux>
- `shouldShowErrors` управляет `aria-invalid`, а не сам факт существования скрытой ошибки.
- Async validation сообщает `aria-busy`.
- Error messages связываются с control через stable ids/`aria-describedby` на уровне visual field.
- Validation wrapper не выбирает visual error tokens; они принадлежат leaf M3 control.
</a11y-ux>

<reuse>
`useField`, `useFormBuilder`, `useFormSchema`, VeeValidate form/field contexts и существующий `MMessages`. Не создавать `useValidation`, если он лишь переименовывает `useField`.
</reuse>

<styles>
Renderless/composable layers не имеют SCSS. Error, pending, disabled и focus tokens принадлежат visual field component.
</styles>

<decision-needed>
1. Нужен ли public `MValidation` или достаточно обновлённого `useField`.
2. Exact default validation/error-display triggers.
3. Standalone rules API и тип `ValidationRule<T>`.
4. Reactive path re-registration policy.
5. External errors clearing contract.
</decision-needed>

<recommended-direction>
Расширенный canonical `useField` для kit internals плюс тонкий public renderless `MValidation` для custom controls. Новый `useValidation` не создавать.
</recommended-direction>
