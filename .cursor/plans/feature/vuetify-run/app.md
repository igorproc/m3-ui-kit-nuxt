# MApp

<identity>
Vuetify reference: `VApp`  
PrimeTime target: `MApp`  
Phase: 1 — runtime and shell  
Type: public, optional convenience boundary
</identity>

<implementation-status state="done" updated="2026-07-13">
Public component, co-located tokens and focused unit tests are present in kit.
</implementation-status>

<problem>
PrimeTime UI поставляется как Nuxt layer и уже имеет root infrastructure:
theme initialization, `#ui-overlay-host`, modal container и Nuxt loading
state. Пока потребитель использует layer `app.vue`, всё работает автоматически.

Проблема появляется, когда приложение переопределяет `app.vue`: разработчик
вынужден знать внутреннее устройство kit и вручную повторять код из
`kit/app/app.vue`. Сейчас именно это происходит в docs. Пропуск overlay host
ломает teleport у Menu/Dropdown; пропуск global modal container ломает modal
family; поздний запуск theme store может дать неверный первый кадр.
</problem>

<user-job>
Разработчик хочет полностью контролировать Nuxt root template, но подключить
инфраструктуру PrimeTime одной декларативной оболочкой и не копировать
внутренний код kit.
</user-job>

<solution>
`MApp` — необязательная convenience boundary. Она собирает инфраструктуру
PrimeTime, но не становится обязательным родителем каждого M-компонента.

- Стандартное приложение, не переопределяющее layer `app.vue`, ничего не меняет.
- Приложение с собственным `app.vue` может обернуть root content в `MApp`.
- Продвинутый потребитель может подключить необходимые primitives вручную;
  этот путь документируется, но считается low-level API.
</solution>

<why-component>
Проблема относится к композиции root DOM и slots, поэтому component boundary
понятнее composable: она физически создаёт overlay host, modal container и
место для optional loading UI. Composable не может гарантировать присутствие
этих DOM anchors.
</why-component>

<user-flow>
1. Nuxt создаёт приложение и вызывает setup `MApp`.
2. Theme store инициализирует HTML theme attributes до первого рендера.
3. `MApp` создаёт единственный `#ui-overlay-host`.
4. Browser-only modal container активируется после hydration.
5. Default slot рендерит `NuxtRouteAnnouncer`, layout и pages потребителя.
6. Если передан `loading` slot, он получает readonly loading state и сам
   решает, какой UI показывать.
</user-flow>

<api>
Props:

```ts
interface MAppProps {
  tag?: string // default: 'div'
}
```

Slots:

```ts
interface MAppSlots {
  default(): unknown
  loading?(scope: {
    progress: Readonly<Ref<number>>
    isLoading: Readonly<ComputedRef<boolean>>
  }): unknown
}
```

`loading` не имеет визуального fallback. Без slot loading state продолжает
работать, но `MApp` ничего не рисует. Пример:

```vue
<MApp>
  <template #loading="{ progress, isLoading }">
    <MProgressLinear
      v-if="isLoading.value"
      :value="progress.value"
      class="app-loading"
    />
  </template>

  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</MApp>
```

Exposed API: readonly root element ref. Emits и v-model отсутствуют.
</api>

<composition>
`MApp` не строит layout. `MLayout` остаётся отдельным optional child и
единолично управляет full-height/scroll ownership.

`NuxtRouteAnnouncer` и routing принадлежат приложению и остаются в default
slot. `MApp` не добавляет их автоматически, чтобы не создавать дубликаты.
</composition>

<reuse>
- `useThemeStore()` — единственный источник HTML theme attributes.
- `useLoadingIndicator()` — источник readonly `progress`/`isLoading` для slot.
- Существующий `core-global-container` / `ModalsContainer` — modal runtime.
- Существующий `#ui-overlay-host` — teleport target Menu/Dropdown/overlay family.
- Существующие `useStack` и modal context — z-index/dismiss infrastructure.

Не создавать второй theme state, loading timer, overlay stack или layout
engine. Текущий `core-scope` нужно разделить: modal infrastructure остаётся
внутренней частью `MApp`, а жёстко отрисованный progress indicator удаляется
в пользу loading slot.
</reuse>

<states>
- SSR: root surface и overlay host присутствуют; browser-only modal container
  имеет безопасную ClientOnly boundary.
- Hydrating: default content сохраняет одинаковую структуру.
- Idle: loading slot либо отсутствует, либо получает `isLoading=false`.
- Loading: slot получает реактивные readonly refs; presentation принадлежит
  приложению.
- Misconfigured manual setup: overlay consumers в dev выводят actionable
  warning об отсутствии `#ui-overlay-host`.
</states>

<m3-ux>
`MApp` не навязывает конкретный progress visual. Потребитель может выбрать
linear, expressive или собственный M3-like loading UI под контекст продукта.
Root surface использует semantic background/on-background roles, не raw color.
Theme не должна визуально переключаться после hydration.
</m3-ux>

<styles>
Создать `app/assets/stylesheet/components/app/_index.scss` с `$tokens`:

- root background/on-background;
- `min-height: 100dvh`;
- overlay host z-index role;
- optional root isolation/containment только после проверки fixed overlays.

SFC получает значения только через `material-map()` и `g()`. `fullHeight`
не является prop `MApp`: fixed viewport и overflow остаются API `MLayout`.
</styles>

<a11y>
`MApp` не создаёт landmark role автоматически: это нейтральная root boundary.
Landmarks принадлежат layout/page. Loading slot consumer отвечает за
`aria-busy`/live announcement своего UX; docs дают корректный пример.
</a11y>

<dx>
Recommended custom root:

```vue
<MApp>
  <NuxtRouteAnnouncer />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</MApp>
```

`MApp` не обязателен. Low-level manual setup документирует необходимые
anchors отдельно, но не требует импорта private components. В dev второй
`MApp` выводит warning, потому что fixed id overlay host должен быть один.
</dx>

<non-goals>
- Routing, page transitions и `NuxtRouteAnnouncer`.
- Layout/grid/scroll management.
- Несколько независимых MApp в одном document.
- Встроенный визуальный loading indicator.
- Замена Nuxt root lifecycle или создание собственного app store.
</non-goals>

<tests>
- SSR содержит root и один overlay host без hydration mismatch.
- Theme attributes доступны на первом SSR render.
- `loading` slot получает readonly refs и реактивно обновляется.
- Без loading slot progress UI отсутствует.
- Menu/Dropdown teleport работают внутри custom root.
- Modal container создаётся один раз на клиенте.
- Второй MApp выдаёт dev warning.
- MApp работает с MLayout и без него.
</tests>

<migration>
1. Реализовать `MApp` поверх существующей root infrastructure.
2. Перевести `kit/app/app.vue` на `MApp` без изменения visual behavior, кроме
   удаления обязательного progress UI.
3. Перевести `docs/app/app.vue` на `MApp` и удалить дублированные theme,
   overlay и core-scope declarations.
4. Добавить docs: standard layer root, custom app root, loading slot и manual
   low-level setup.
</migration>

<done>
- Потребитель с custom `app.vue` подключает PrimeTime infrastructure одной
  оболочкой.
- `MApp` остаётся optional и не требуется отдельным компонентам.
- Loading presentation существует только через slot и получает progress refs.
- Kit и docs используют один и тот же MApp contract.
- ESLint/Stylelint проходят без ошибок; SSR, teleport и duplicate-root tests
  добавлены.
</done>

<questions></questions>
