# MLazy: smart activation, loading and hydration guidance

<identity>
Vuetify: `VLazy` · Target: `MLazy` · Phase: 1 · Type: public runtime boundary + Nuxt integration guidance
</identity>

<problem>
Тяжёлые charts, editors, maps и data views не всегда нужны в initial interaction path. Разработчику нужен один понятный способ отложить их активацию до свободного времени browser, появления в viewport или намерения взаимодействовать, не собирая вручную `IntersectionObserver`, async component, loading placeholder и cleanup.

При этом нельзя смешивать три разных обещания: отложенный mount Vue subtree, загрузку отдельного JS chunk и hydration уже существующего SSR HTML. Обычный wrapper не способен автоматически превратить произвольный slot в compile-aware Nuxt lazy hydration boundary.
</problem>

<performance-model>
`MLazy` управляет моментом client activation и mount. Отдельный JS chunk гарантируется только когда consumer передаёт настоящий Nuxt lazy/async component (`<LazyHeavyChart />`). Loading async dependency координирует внутренний `<Suspense>`.

SSR HTML с delayed hydration остаётся native Nuxt capability (`hydrate-on-visible`, `hydrate-on-idle`, `hydrate-on-interaction`) и документируется рядом, но не имитируется через `v-if`.
</performance-model>

<solution>
`MLazy` — готовая layout-preserving runtime-обёртка с activation controller, placeholder/loading/error slots и Suspense boundary. Он не экспортирует `useInView` и не создаёт вводящую в заблуждение `v-lazy`: directive монтируется только после создания DOM и не может сама предотвратить создание component subtree.
</solution>

<modes>
```ts
type MLazyMode = 'eager' | 'on-idle' | 'on-view' | 'on-interaction'
```

- `eager`: content активируется сразу; нужен для единого конфигурируемого API. Это стандартная загрузка.
- `on-idle`: activation через idle callback с максимальным timeout; снимает работу с critical rendering path.
- `on-view`: activation по IntersectionObserver, обычно заранее через положительный `rootMargin`.
- `on-interaction`: activation при намерении пользователя — pointer/focus/click; первый interaction не должен теряться.

Термин `idle` не используется как имя eager strategy: в Vue/Nuxt он уже означает отложенную hydration в свободное время browser.
</modes>

<api>
```ts
type LazyInteraction = 'pointerenter' | 'pointerdown' | 'click' | 'focus'

interface MLazyProps {
  mode?: MLazyMode
  active?: boolean
  once?: boolean

  timeout?: number
  rootMargin?: string
  threshold?: number | number[]
  interactions?: LazyInteraction[]

  minWidth?: string | number
  minHeight?: string | number
  transition?: string | false
  disabled?: boolean
}

interface MLazyEmits {
  (event: 'update:active', value: boolean): void
  (event: 'activate', activation: LazyActivation): void
  (event: 'visible'): void
  (event: 'pending'): void
  (event: 'resolve'): void
  (event: 'error', error: unknown): void
}
```

Defaults:

- `mode: 'on-view'`;
- `active: undefined` (uncontrolled);
- `once: true`;
- `timeout: 2000` для `on-idle`;
- `rootMargin: '200px 0px'` для preactivation до фактического появления;
- `threshold: 0`;
- `interactions: ['pointerenter', 'focus', 'click']`;
- `transition`: короткий M3 emphasized/deceleration appearance;
- `disabled: false`.
</api>

<state-machine>
```ts
type MLazyStatus = 'idle' | 'pending' | 'active' | 'error'

interface LazyActivation {
  reason: 'eager' | 'idle' | 'view' | 'interaction' | 'manual'
  event?: Event
}
```

`idle → pending` происходит после выбранного trigger. В этот момент создаётся Suspense/default subtree и начинается async import. `pending → active` происходит по Suspense resolve. Ошибка попадает в `error`; retry пересоздаёт async subtree новым key.

При `once: true` observer/listeners отключаются после activation, а content никогда автоматически не размонтируется при выходе из viewport. Virtualization и recycling принадлежат `useVirtualScroll`, а не `MLazy`.
</state-machine>

<slots>
```ts
interface MLazySlotState {
  status: MLazyStatus
  isActive: boolean
  activation: LazyActivation | null
  activate: () => void
  retry: () => void
}
```

- `default`: async/heavy content; получает slot state.
- `placeholder`: до activation; получает slot state.
- `fallback`: во время Suspense pending. Если отсутствует, повторно используется `placeholder` для визуальной стабильности.
- `error`: получает `{ ...state, error, retry }`.

Vue Suspense допускает один immediate child в default/fallback, поэтому `MLazy` создаёт стабильный внутренний boundary root и документирует fragment behavior.
</slots>

<primary-dx>
```vue
<MLazy
  mode="on-view"
  min-height="320"
>
  <LazyHeavyChart />

  <template #placeholder>
    <ChartSkeleton />
  </template>
</MLazy>
```

Здесь `MLazy` откладывает создание subtree, а префикс `Lazy` обеспечивает Nuxt dynamic import и отдельный chunk.
</primary-dx>

<suspense>
`Suspense` используется только после activation:

```vue
<Suspense v-if="isActivated">
  <slot />

  <template #fallback>
    <slot name="fallback" />
  </template>
</Suspense>
```

Если отрендерить Suspense до activation, он сразу начнёт разрешать async default tree и загрузит chunk, поэтому сам по себе Suspense не является lazy trigger.

Suspense events `pending`, `resolve`, `fallback` синхронизируют status. Ошибки ловятся отдельным error boundary через `onErrorCaptured`, потому что Suspense не предоставляет error slot.
</suspense>

<interaction-ux>
`on-interaction` обязан учитывать keyboard и touch, не только hover. Placeholder, предлагающий действие, должен быть семантически интерактивным. Первый trigger event должен либо корректно replay-иться после activation, либо activation API должен явно выполнить намерение; click нельзя молча потерять во время chunk loading.

До доказательства надёжного generic event replay первая реализация гарантирует activation по interaction, но docs требуют handler-level continuation для действия после загрузки. Native Nuxt `hydrate-on-interaction` рекомендуется там, где нужен replay поверх SSR HTML.
</interaction-ux>

<controlled-mode>
`v-model:active` позволяет manual preactivation и сброс. В uncontrolled режиме `activate()` необратим при `once: true`. Если consumer явно переводит controlled `active` из true в false, subtree уничтожается вместе с локальным состоянием; это должно быть осознанным действием и подробно документируется.
</controlled-mode>

<nuxt-hydration>
Три честных recipes:

Client lazy mount + separate chunk:

```vue
<MLazy mode="on-view">
  <LazyAnalyticsChart />
</MLazy>
```

SSR HTML + delayed hydration:

```vue
<LazyProductGallery hydrate-on-visible />
```

Client-only widget:

```vue
<ClientOnly>
  <MLazy mode="on-interaction">
    <LazyMapEditor />
  </MLazy>

  <template #fallback>
    <MapPlaceholder />
  </template>
</ClientOnly>
```

Nuxt lazy hydration работает только для lazy SFC и требует strategy attribute непосредственно в template; `MLazy` не обещает обойти это compiler constraint. Возможный `defineMLazyComponent(loader, strategy)` исследуется отдельно и не входит в public API до проверки chunk splitting, SSR и event replay.
</nuxt-hydration>

<layout>
- Root резервирует `minWidth`/`minHeight`, предотвращая CLS.
- Числовые размеры переводятся в design-unit `rem` по правилу kit `1rem = 1px макета`.
- После resolve content занимает тот же boundary.
- Placeholder полностью управляется consumer; default — пустая зарезервированная область без spinner.
- Above-the-fold critical content не должен использовать delayed mode.
</layout>

<m3-ux>
`MLazy` не навязывает skeleton appearance. Consumer переиспользует подходящий recipe из будущей skeleton system phase, `MProgressCircular` или собственный placeholder slot. Появление content использует системные M3 motion tokens; при reduced motion transition отключается. Error state должен предлагать понятный retry, если операция восстановима.
</m3-ux>

<styles>
Создать co-located `components/lazy/_index.scss` только для boundary layout и appearance motion tokens. Никаких content colors. Nested `$tokens` map разрешается через `material-map()`/`g()`; literal durations/sizes в SFC запрещены.
</styles>

<reuse>
Переиспользовать VueUse IntersectionObserver/idle utilities, Vue `Suspense`, Nuxt `Lazy*` dynamic imports, native Nuxt hydration attributes, future skeleton recipes и `MProgressCircular`. Не создавать raw scroll loop, собственный async-component loader или параллельную hydration runtime.
</reuse>

<tests>
- четыре activation mode и manual activation;
- lazy component chunk/import начинается только после trigger;
- placeholder → Suspense fallback → active lifecycle;
- fallback наследует placeholder при отсутствии отдельного slot;
- async setup и вложенные async dependencies;
- error capture, retry и single resolution;
- on-view rootMargin/threshold, observer cleanup;
- on-idle timeout/cancellation;
- pointer, keyboard focus и click activation;
- controlled reset уничтожает subtree только явно;
- layout reservation и reduced motion;
- SSR placeholder hydration без mismatch;
- integration recipes для native Nuxt delayed hydration.
</tests>

<non-goals>
- Virtualization/recycling offscreen content.
- Автоматическая delayed hydration произвольного slot subtree.
- Data fetching policy: component сам использует `useAsyncData`/`useFetch`.
- Default skeleton для всех типов content.
</non-goals>

<done>
Разработчик выбирает момент client activation одним API, получает стабильный placeholder/loading/error UX и реальную отсрочку chunk при использовании Nuxt lazy component; SSR delayed hydration документирована без ложной wrapper-абстракции.
</done>

<questions></questions>
