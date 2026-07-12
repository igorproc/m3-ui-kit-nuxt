# Hover and focus: pending API decision

<identity>
Status: pending discussion · Vuetify reference: `VHover` · Candidate targets: `MHover`, `v-hover`, `useHover`, `MFocused`, `v-focused`, `useFocusWithin`
</identity>

<reason-for-pending>
Потребность в реактивных hover/focus states реальна, но пока не утверждено, какая Vue-форма даёт лучший PrimeTime DX. Решение нельзя принимать только ради соответствия имени `VHover`: CSS уже покрывает обычные M3 state layers, а JavaScript нужен лишь тогда, когда состояние меняет содержимое или поведение.
</reason-for-pending>

<shared-problem>
- Разработчику иногда нужно показать content, запустить preview или изменить логику при hover/focus.
- Ручные pointer/focus handlers повторяют cleanup, delays и touch policy.
- Hover не заменяет keyboard focus, а focus не должен искусственно проходить через hover delay.
- Компонент kit не должен навязывать, что именно делать с полученным состоянием.
</shared-problem>

<rule>
Если задача решается чистым `:hover`/`:focus-visible` и M3 SCSS tokens, JavaScript primitive не используется. Кандидаты ниже предназначены только для реактивного template/business state.
</rule>

<variant id="renderless-components">
## Вариант A: renderless `MHover` и `MFocused`

```vue
<MHover v-slot="{ isHovering, props }" :open-delay="200">
  <MCard v-bind="props">
    <CardPreview v-if="isHovering" />
  </MCard>
</MHover>
```

```vue
<MFocused v-slot="{ isFocused, isFocusVisible, props }">
  <div v-bind="props">
    ...
  </div>
</MFocused>
```

Candidate props:

```ts
interface MHoverProps {
  disabled?: boolean
  openDelay?: number
  closeDelay?: number
}

interface MFocusedProps {
  disabled?: boolean
  within?: boolean
}
```

Slot contracts:

```ts
interface MHoverSlot {
  isHovering: boolean
  props: {
    onPointerenter: (event: PointerEvent) => void
    onPointerleave: (event: PointerEvent) => void
  }
}

interface MFocusedSlot {
  isFocused: boolean
  isFocusWithin: boolean
  isFocusVisible: boolean
  props: {
    onFocusin: (event: FocusEvent) => void
    onFocusout: (event: FocusEvent) => void
  }
}
```

Плюсы:

- state сразу доступен в template;
- не нужен template ref;
- компонент не добавляет DOM и только отдаёт event props;
- разработчик сам выбирает target через `v-bind="props"`;
- удобно читать рядом с условным content.

Минусы:

- renderless component непривычен части пользователей;
- scoped slot добавляет уровень вложенности;
- нужно явно документировать обязательный `v-bind="props"`;
- несколько targets требуют ручного распределения handlers либо расширения контракта.
</variant>

<variant id="directives">
## Вариант B: `v-hover` и `v-focused`

Callback form:

```vue
<MCard v-hover="value => isHovering = value" />
```

Object form:

```vue
<MCard
  v-hover="{
    enter: onEnter,
    leave: onLeave,
    openDelay: 200,
    closeDelay: 120,
  }"
/>
```

```vue
<section
  v-focused="{
    change: value => isFocused = value,
    within: true,
  }"
/>
```

Плюсы:

- непосредственно привязаны к target DOM;
- нет wrapper/slot nesting;
- подходят для imperative callbacks и analytics/prefetch side effects;
- легко применяются к native и kit elements.

Минусы:

- директива не умеет естественно вернуть reactive state в template;
- callback assignment в template ухудшает читаемость;
- снаружи обычно всё равно требуется `ref`;
- object binding API сложнее типизировать и документировать;
- для обычного state rendering почти не лучше явных `@pointerenter/@pointerleave`.
</variant>

<variant id="composables">
## Вариант C: `useHover` и `useFocusWithin`

```vue
<script setup lang="ts">
const target = useTemplateRef<HTMLElement>('target')
const { isHovering } = useHover(target, {
  enterDelay: 200,
  leaveDelay: 120,
})

const { isFocusWithin, isFocusVisible } = useFocusWithin(target)
</script>

<template>
  <MCard ref="target">
    <CardPreview v-if="isHovering" />
  </MCard>
</template>
```

Плюсы:

- полная composition API гибкость;
- хорошо подходит logic-heavy consumers;
- reactive target и несколько derived states;
- легко переиспользовать внутри kit-компонентов.

Минусы:

- требует template ref;
- больше setup boilerplate для простой задачи;
- соблазняет использовать JavaScript там, где достаточно CSS;
- не соответствует видению простой готовой template-обёртки.
</variant>

<variant id="hybrid">
## Вариант D: public renderless components поверх private composables

Public DX остаётся template-first:

```vue
<MHover v-slot="hover">
  <MCard v-bind="hover.props" />
</MHover>
```

Внутренне `MHover` использует private/shared `useHoverState()`. Composable не обязательно экспортировать как public API.

Плюсы:

- простой public DX;
- логика остаётся тестируемой и переиспользуемой внутри kit;
- позднее composable можно безопасно экспортировать при доказанном спросе.

Минусы:

- две внутренние сущности ради небольшой функции;
- важно не превратить private composable в параллельный незадокументированный API.

Это текущий наиболее сбалансированный кандидат.
</variant>

<hover-policy>
- Использовать pointer events, не mouse events.
- Touch не создаёт sticky hover.
- `disabled` сбрасывает состояние и отменяет timers.
- Повторный enter отменяет pending leave; leave отменяет pending enter.
- Unmount обязательно очищает timers/listeners.
- Никаких global pub/sub: hover локален target element.
- Multi-target hover group (activator + floating content) пока не включать; это может принадлежать overlay/tooltip interaction layer.
</hover-policy>

<focus-policy>
- Focus — отдельная capability, не поле внутри hover primitive.
- Различать direct focus, focus-within и browser `:focus-visible` semantics.
- Focus для keyboard accessibility не проходит через hover delays.
- Renderless/helper API не должен самостоятельно добавлять tabindex: focusability определяет настоящий interactive consumer.
- Для чистого styling всегда предпочитать CSS `:focus-visible`/`:focus-within`.
</focus-policy>

<m3-policy>
Ни один вариант не содержит visual styles. M3 hover/focus state layers остаются в `$tokens` map конкретного визуального компонента. Эти primitives сообщают состояние, но не выбирают color, opacity, outline, elevation или motion потребителя.
</m3-policy>

<decision-needed>
1. Основной public DX: renderless component или directive.
2. Нужен ли отдельный public `MFocused`, либо focus остаётся CSS/private helper.
3. Нужны ли delays в первой версии `MHover`.
4. Экспортировать ли composables публично или оставить implementation detail.
</decision-needed>

<recommended-direction>
Public renderless `MHover`, при необходимости `MFocused`, поверх private lifecycle-safe state helpers. Директивы не добавлять, пока не появится реальный callback-only сценарий. Composables не экспортировать на первом этапе.
</recommended-direction>
