# useHotkey and global hotkey registry

<identity>
Vuetify reference: `useHotkey` / behavioral part of `VHotkey` · Target: `useHotkey` · Phase: 1 · Type: public composable + internal global pub/sub registry
</identity>

<problem>
Application shortcuts нельзя надёжно реализовывать разрозненными `window.addEventListener('keydown')`: каждый consumer заново нормализует клавиши, забывает cleanup, перехватывает ввод в fields, конфликтует с dialog/menu и отдельно форматирует подпись shortcut. В результате реально зарегистрированное сочетание и показанная пользователю подсказка могут расходиться.

Локальная keyboard navigation (`ArrowDown` внутри menu, roving tabindex в tabs/listbox) — другая задача. Она принадлежит DOM-компоненту и не должна попадать в глобальный hotkey registry.
</problem>

<user-jobs>
- Зарегистрировать application-level shortcut одной декларацией без ручных browser listeners.
- Использовать platform-aware `mod`, чтобы одна команда работала как Command на macOS и Control на Windows/Linux.
- Получить из той же декларации presentation model для `<MHotkey :hotkey="shortcut" />`.
- Не ломать печать в input/textarea/contenteditable.
- Дать открытому dialog/editor/command palette приоритет над shortcut фонового экрана.
- Реактивно включать, выключать и переназначать shortcut.
</user-jobs>

<solution>
`useHotkey()` подписывает consumer на единый SSR-safe global registry. Registry использует один реальный `window` listener для `keydown` и, только когда нужны pressed states, один для `keyup`; затем публикует нормализованные события подписчикам с учётом active scopes и приоритетов.

Composable возвращает не только lifecycle controls, но и readonly presentation model. Поэтому behavior и визуальная подсказка всегда строятся из одного `HotkeyDefinition`.
</solution>

<primary-dx>
```vue
<script setup lang="ts">
const shortcut = useHotkey(['mod', 'shift', 'p'], openCommandPalette, {
  scope: 'workspace',
})
</script>

<template>
  <MMenuItem @click="openCommandPalette">
    Command palette

    <template #trailing>
      <MHotkey :hotkey="shortcut" />
    </template>
  </MMenuItem>
</template>
```

На macOS компонент покажет `⌘ ⇧ P`, на Windows/Linux — `Ctrl + Shift + P`; registry при этом сопоставляет ту же platform-specific комбинацию.
</primary-dx>

<types>
```ts
type HotkeyModifier = 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'

type HotkeyNamedKey
  = 'enter'
    | 'escape'
    | 'space'
    | 'tab'
    | 'backspace'
    | 'delete'
    | 'arrow-up'
    | 'arrow-down'
    | 'arrow-left'
    | 'arrow-right'

type HotkeyKey = HotkeyModifier | HotkeyNamedKey | string
type HotkeyPlatform = 'auto' | 'mac' | 'windows' | 'linux'

interface HotkeyDefinition {
  keys: HotkeyKey[]
  platform?: HotkeyPlatform
}

interface UseHotkeyOptions {
  enabled?: MaybeRefOrGetter<boolean>
  scope?: MaybeRefOrGetter<string | undefined>
  event?: 'keydown' | 'keyup'
  inputs?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  repeat?: boolean
  exact?: boolean
}

interface HotkeyPresentation {
  keys: Readonly<ComputedRef<HotkeyKey[]>>
  displayKeys: Readonly<ComputedRef<HotkeyDisplayKey[]>>
  ariaLabel: Readonly<ComputedRef<string>>
  platform: Readonly<ComputedRef<Exclude<HotkeyPlatform, 'auto'>>>
  isActive: Readonly<ComputedRef<boolean>>
  pressedKeys: Readonly<Ref<HotkeyKey[]>>
}

interface UseHotkeyReturn extends HotkeyPresentation {
  isPressed: Readonly<ComputedRef<boolean>>
  isPaused: Readonly<Ref<boolean>>
  pause: () => void
  resume: () => void
  stop: () => void
}
```

Overloads принимают либо `HotkeyKey[]`, либо reactive `HotkeyDefinition`. Основной документированный синтаксис — массив: он типизируется, не требует парсинга separator characters и напрямую подходит визуальному компоненту.
</types>

<defaults>
- `platform: 'auto'`;
- `event: 'keydown'`;
- `inputs: false`;
- `preventDefault: true` для совпавшего shortcut;
- `stopPropagation: false`;
- `repeat: false`;
- `exact: true`;
- `enabled: true`.

`preventDefault` вызывается только после полного match, не на каждом потенциальном modifier/key event.
</defaults>

<mod-policy>
`mod` — документированный platform abstraction:

- macOS: регистрируется как `Meta`, отображается символом `⌘`, accessible label — `Command`;
- Windows/Linux: регистрируется как `Control`, отображается как `Ctrl`, accessible label — `Control`;
- iPad/iOS с аппаратной клавиатурой следует Mac/Apple policy;
- explicit `ctrl` и `meta` не преобразуются и используются, когда shortcut намеренно platform-specific;
- порядок отображения модификаторов нормализуется компонентом независимо от порядка входного массива;
- platform определяется SSR-safe: сервер формирует стабильную нейтральную модель, окончательная platform presentation уточняется после hydration без изменения зарегистрированной команды до client activation.
</mod-policy>

<matching>
- По умолчанию matching основан на нормализованном `KeyboardEvent.key`, потому что application commands выражаются логическими символами и работают с активной раскладкой.
- Named aliases нормализуются (`esc` → `escape`, `return` → `enter`, пробел → `space`). В public docs показывается canonical form.
- Physical `KeyboardEvent.code` не входит в основной API. Если появится доказанный game/editor scenario, он добавляется явной отдельной формой, а не меняет semantics существующих definitions.
- Modifier-only shortcuts запрещены с dev warning.
- Key sequences (`g`, затем `h`) не входят в первую версию: они требуют отдельной timeout/conflict модели и будут добавлены только по реальному сценарию.
</matching>

<input-policy>
При `inputs: false` registry игнорирует события, чей composed path начинается в `input`, `textarea`, `select` или editable element. При `inputs: true` shortcut разрешён во время ввода — типичный случай для Escape или command palette. Consumer всё равно отвечает за то, чтобы сочетание не конфликтовало с нативным editing UX.
</input-policy>

<scopes>
Scope решает конфликт контекстов, а не просто группирует подписки:

- unscoped shortcuts принадлежат application root;
- active overlay автоматически активирует собственный scope и временно подавляет совпадающие shortcuts нижележащих scopes;
- внутри одного scope более поздняя/явно приоритетная активная подписка получает событие первой;
- после первого handled match событие не публикуется нижним scopes;
- одинаковая комбинация в одном active scope вызывает dev warning;
- `pause()` отключает конкретную подписку, не весь scope.

Registry должен интегрироваться с общим overlay stack/context из `overlay.md`, а не создавать независимое представление о вложенности dialog/menu.
</scopes>

<global-pubsub>
- Переиспользовать `useGlobalListener('window', ...)`: один master DOM listener fan-out события подписчикам.
- Hotkey registry поверх него хранит только normalized subscriptions, active scope ordering и pressed key state.
- Registry создаётся request-safe через Nuxt plugin/app-scoped provide либо `useState`; новый Pinia store не нужен.
- Подписка автоматически удаляется через `onScopeDispose`; `stop()` доступен для раннего ручного cleanup.
- Reactive `enabled`, keys и scope обновляют registry entry без повторного создания component logic.
- `window.blur` и потеря visibility очищают `pressedKeys`, чтобы визуальное состояние не зависало.
</global-pubsub>

<reuse>
Переиспользовать существующий `useGlobalListener` для дедупликации browser listeners и будущий overlay stack для scope ordering. Presentation types совместно используются `MHotkey`; не создавать второй formatter внутри visual component. Локальные handlers menu/tabs/date-picker не мигрируют в registry.
</reuse>

<a11y-ux>
- Shortcut является enhancement: критичная операция обязана оставаться доступной через видимый control.
- `ariaLabel` содержит произносимые названия (`Command Shift P`), а не только glyphs.
- Shortcut не выполняется при composition (`event.isComposing`) и не вмешивается в IME.
- Disabled consumer должен передавать то же reactive condition в `enabled`; `MHotkey` получает `isActive` из presentation model и показывает недоступность без рассинхронизации.
</a11y-ux>

<styles>
Нет visual styles: стили принадлежат `MHotkey`. Composable и registry не создают DOM.
</styles>

<tests>
- один global listener обслуживает несколько bindings и снимается после последней подписки;
- `mod` matching и presentation для mac/windows/linux;
- reactive keys/enabled/scope;
- input/contenteditable/IME policy;
- exact modifiers, aliases, repeat и preventDefault только после match;
- scope priority, overlay nesting и conflict warning;
- pressed keys очищаются на keyup, blur, visibility loss и stop;
- SSR no-op до client activation, без hydration mismatch в presentation;
- `displayKeys` и реальный matcher используют одно definition.
</tests>

<done>
Application shortcut регистрируется один раз, безопасно участвует в глобальном pub/sub и scopes, автоматически очищается и напрямую передаётся в `MHotkey` без повторного описания комбинации.
</done>

<questions></questions>
