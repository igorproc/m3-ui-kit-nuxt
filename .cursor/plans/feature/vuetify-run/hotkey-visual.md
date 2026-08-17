# MHotkey

<identity>
Vuetify roles: visual `VHotkey` + single-key `VKbd` coverage · Target: `MHotkey` · Phase: 1 · Type: public visual component
</identity>

<implementation-status state="done" updated="2026-07-13">
Public visual component, tokens and shared hotkey tests are present.
</implementation-status>

<problem>
Shortcut-подсказки часто собираются вручную из `<kbd>`, поэтому разные экраны по-разному подписывают Command/Control, путают порядок модификаторов, не имеют accessible label и расходятся с реально зарегистрированной комбинацией. Отдельный `MKbd` решает внешний вид одной клавиши, но не решает platform normalization и связь с поведением.
</problem>

<user-jobs>
- Показать комбинацию, зарегистрированную через `useHotkey`, без повторного перечисления клавиш.
- Показать статическую подсказку даже без активной регистрации shortcut.
- Корректно отобразить одну клавишу, тем самым закрывая роль `VKbd` без отдельного public-компонента.
- Отразить unavailable и физически нажатые клавиши в docs/tutorial UI.
</user-jobs>

<solution>
`MHotkey` — пассивный M3-like presentation component. Основной API принимает целый `HotkeyPresentation`, возвращённый `useHotkey`. Альтернативный `keys` предназначен для статического отображения и использует тот же shared formatter.
</solution>

<api>
```ts
interface MHotkeyProps {
  hotkey?: HotkeyPresentation
  keys?: HotkeyKey[]
  platform?: HotkeyPlatform
  disabled?: boolean
  separator?: string
  ariaLabel?: string
}
```

Rules:

- должен быть передан ровно один source: `hotkey` или `keys`; оба/ни одного дают dev warning;
- `hotkey` является рекомендуемым путем и имеет приоритет только ради graceful production behavior;
- при `hotkey` component автоматически читает `displayKeys`, `pressedKeys`, `ariaLabel` и `isActive`;
- `disabled` позволяет явно выключить статический `keys` mode; для behavioral mode основной источник disabled state — `hotkey.isActive`;
- `platform` применяется к static keys mode; presentation из composable уже содержит resolved platform;
- `separator` по умолчанию platform-aware: визуальный spacing/`+` задаётся formatter/token policy, а не вставляется screen reader text.
</api>

<primary-dx>
```vue
<MHotkey :hotkey="shortcut" />
```

Static:

```vue
<MHotkey :keys="['mod', 'k']" />
<MHotkey :keys="['enter']" />
```

Второй пример покрывает single-key keyboard badge и делает отдельный `MKbd` ненужным, пока не появится независимый сценарий.
</primary-dx>

<states>
- `enabled`: стандартная shortcut hint;
- `disabled`: сниженный M3 emphasis, `aria-disabled="true"`; это не интерактивный control;
- `pressed`: применяется отдельно к элементам из `pressedKeys`, визуально показывает физическое удержание;
- platform-resolving: SSR-safe нейтральная раскладка до окончательного client formatting без layout-breaking placeholder.

Не добавлять hover/focus/pressed state layer самого контейнера: `MHotkey` не кликабельный и не фокусируемый. `pressed` относится к изображаемой клавише, а не к interaction state компонента.
</states>

<slots>
- `key`: scoped slot `{ key, label, pressed, disabled, index }` для редкого кастомного отображения одной клавиши;
- `separator`: scoped slot `{ index, platform }`.

Default rendering остаётся полноценным и M3-like. Slots не должны требоваться для обычного menu/button hint.
</slots>

<composition>
Внутренний private sub-компонент/тонкий template fragment отображает одну клавишу семантическим `<kbd>`. Public `MKbd` не создаётся: `MHotkey :keys="['enter']"` уже закрывает single-key job. Если впоследствии обнаружится самостоятельная роль keycap вне shortcut, private primitive можно повысить до public без изменения `MHotkey` API.
</composition>

<reuse>
Использовать `HotkeyPresentation`, `HotkeyDisplayKey` и platform formatter из `hotkey.md`; не повторять mapping `mod`, aliases, ordering и accessible names в SFC. В menu/list item размещать через существующий trailing slot; компонент не знает о layout родителя.
</reuse>

<m3-ux>
- Это M3-like supporting information, а не имитация физической клавиатуры и не отдельная декоративная дизайн-система.
- Container/keycap colors используют surface/on-surface-variant/outline roles с достаточным contrast.
- Shape и typography согласуются с compact supporting labels kit.
- Disabled использует M3 disabled emphasis tokens.
- Pressed state меняет surface/elevation/offset через tokens и motion; reduced motion сохраняет понятное статическое отличие.
- Длинные локализованные названия (`Пробел`, `Удалить`) не обрезаются без доступной альтернативы.
</m3-ux>

<a11y>
- Root получает единый `aria-label` вроде `Command Shift P`; отдельные decorative glyphs скрываются от screen reader, чтобы комбинация не читалась дважды.
- Static mode генерирует label тем же formatter; explicit `ariaLabel` нужен для предметной локализации или нестандартной клавиши.
- Компонент не получает `tabindex`, role button и click API.
- Визуальная подсказка никогда не заменяет видимое название команды.
</a11y>

<styles>
Создать co-located `components/hotkey/_index.scss` с nested `$tokens` map как минимум для:

```scss
$tokens: (
  md-hotkey: (
    container: (...),
    key: (
      enabled: (...),
      pressed: (...),
      disabled: (...),
    ),
    separator: (...),
  ),
);
```

Все значения разрешаются через `material-map()` и `g()`. Соблюдать правило kit `1rem = 1px макета`; никаких component-state runtime CSS variables и literal colors/sizes в SFC.
</styles>

<tests>
- behavioral `hotkey` и static `keys` modes;
- dev warning для отсутствующего/двойного source;
- `mod` и modifier ordering на mac/windows/linux;
- single key (`enter`) coverage;
- disabled и per-key pressed states;
- generated и explicit aria-label;
- key/separator slots не ломают semantics;
- SSR/hydration platform transition;
- длинные labels и reduced motion.
</tests>

<done>
Одна декларация `useHotkey` одновременно управляет shortcut и его M3-like представлением; статический и single-key случаи доступны без второго public primitive, а platform и a11y подписи не расходятся с matcher.
</done>

<questions></questions>
