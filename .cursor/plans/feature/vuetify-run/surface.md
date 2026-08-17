# MSurface

<identity>
Vuetify reference: `VSheet`  
PrimeTime target: `MSurface`  
Phase: 1 — runtime and foundations  
Type: public, passive visual primitive
</identity>

<implementation-status state="done" updated="2026-07-13">
Public component, token map and focused unit tests are present in kit.
</implementation-status>

<problem>
PrimeTime имеет готовые semantic containers — Card, Dialog, Bottom Sheet,
Menu — но не даёт разработчику безопасно собрать собственную M3-поверхность.
Для dashboard panel, settings section, embedded inspector или custom content
region потребитель вынужден вручную выбирать `surface-container-*`, shape и
shadow. В результате custom UI перестаёт совпадать с темой kit, особенно в
dark/contrast modes.

Текущий `MSheet` не решает эту задачу: это modal bottom sheet с overlay,
stacking, drag-to-dismiss и boolean model.
</problem>

<user-job>
Разработчик хочет обернуть произвольный контент в визуально корректную M3
surface, выбрав понятный preset и shape, не изучая внутренние color/elevation
roles и не создавая ещё один Card.
</user-job>

<solution>
`MSurface` — пассивный semantic container. Он предлагает четыре проверенных M3
surface presets. Каждый preset внутри kit связывает color role, elevation и
outline; потребитель не собирает эти параметры независимо.

| Variant | Semantic role | Elevation | Border |
|---|---|---:|---|
| `plain` | `surface` | 0 | none |
| `filled` | `surface-container` | 0 | none |
| `elevated` | `surface-container-low` | 1 | none |
| `outlined` | `surface` | 0 | `outline-variant` |
</solution>

<why-component>
Surface влияет на реальный root element, background, shape и elevation. Для
потребителя component API понятнее набора utility classes и гарантирует, что
все комбинации остаются частью M3 design contract.
</why-component>

<api>
```ts
type MSurfaceVariant = 'plain' | 'filled' | 'elevated' | 'outlined'

interface MSurfaceProps {
  tag?: string // default: 'div'
  variant?: MSurfaceVariant // default: 'plain'
  shape?: MShape // default: 'none'
}
```

Slots: только default. V-model, custom emits и exposed methods отсутствуют.
Native attributes и listeners проходят на root через Vue fallthrough attrs.
</api>

<user-flow>
1. Разработчик выбирает surface preset по роли контейнера.
2. При необходимости выбирает системную M3 shape.
3. Помещает внутрь собственный semantic content/layout.
4. Theme, dark mode и contrast меняются без дополнительных props или стилей.
</user-flow>

<composition>
`MSurface` не задаёт padding, gap, width или layout. Это visual foundation,
не `MContainer` и не Card content structure.

Будущие `MAlert`, `MBanner`, `MEmptyState` могут использовать MSurface root
через явный import, если не требуется иная native semantic оболочка. `MCard`
не переписывается автоматически: лишний вложенный DOM и изменение article
семантики не оправданы.
</composition>

<reuse>
- Shared `makeVariantProps` адаптируется к `MSurfaceVariant`, если его текущая
  taxonomy совместима; иначе создаётся узкий `makeSurfaceProps`.
- Существующие `$theme-color-link`, `$theme-shape-link` и elevation tokens.
- `material-map()` и `g()` для zero-runtime token resolution.
- `MSheet`, `MCard`, `MContainer` и `MLayout` не дублируются.

Нельзя создавать runtime color calculation, arbitrary CSS color prop,
собственную shape scale или новую elevation system.
</reuse>

<interaction-policy>
`MSurface` не предоставляет `interactive`, `disabled`, `selected`, ripple,
role, tabindex или click emit. Он не обещает keyboard behavior и не рисует
hover/focused/pressed state layers.

Потребитель технически может передать `@click` через fallthrough attrs, но
тогда самостоятельно отвечает за native tag, keyboard activation, focus
indicator и ARIA. Для штатного интерактивного UX используются `MCard`,
`MListItem`, `MButton` или другой semantic component.
</interaction-policy>

<m3-ux>
- `variant` — готовый M3 surface preset, не произвольная тема.
- `shape` принимает только system shape tokens.
- Surface сохраняет корректный contrast между background и content.
- `elevated` использует общую M3 elevation/motion систему.
- Компонент не создаёт visual state layers без interaction semantics.
</m3-ux>

<styles>
Создать `app/assets/stylesheet/components/surface/_index.scss` с вложенной
`$tokens` map:

```scss
$tokens: (
  plain: (container: (color: ...), elevation: ...),
  filled: (container: (color: ...), elevation: ...),
  elevated: (container: (color: ...), elevation: ...),
  outlined: (
    container: (color: ...),
    outline: (color: ..., width: ...),
  ),
  shape: (...),
);
```

В SFC значения читаются только через `material-map()` и `g()`. Локальные
Sass maps, literal colors/radii/shadows и component custom properties
запрещены. Размеры используют design-scale `rem`, где 1rem = 1px макета на
базовой ширине.
</styles>

<a11y>
Default root — нейтральный `div` без role. Потребитель выбирает semantic tag
(`section`, `aside`, `article`) по смыслу своего контента. Surface не меняет
reading/focus order и не скрывает descendants.
</a11y>

<dx>
```vue
<MSurface
  variant="filled"
  shape="large"
>
  <AccountSettings />
</MSurface>
```

Документация объясняет границы:

- custom visual region → MSurface;
- structured actionable content → MCard;
- responsive page width/layout → MContainer/MLayout;
- modal bottom interaction → MSheet;
- floating/anchored actions → MMenu/MOverlay family.
</dx>

<non-goals>
- Arbitrary color, gradient, opacity, radius или shadow API.
- Padding/spacing/grid utilities.
- Interaction semantics и selection state.
- Overlay, teleport, drag, modal model.
- Автоматическая замена root existing components на MSurface.
</non-goals>

<tests>
- Default `plain/none` contract.
- Все variants используют ожидаемые semantic roles/tokens.
- Все MShape values дают системную форму.
- Light/dark/contrast palettes.
- SSR output совпадает с hydrated DOM.
- Native tag и fallthrough attrs/listeners.
- Компонент сам не добавляет role/tabindex/ripple/state classes.
- Stylelint подтверждает отсутствие literal style values.
</tests>

<done>
- Custom M3 surface создаётся без знания internal tokens.
- Публичный API ограничен `tag`, `variant`, `shape`.
- `level`, `elevation`, `color`, `rounded`, `interactive` отсутствуют.
- Surface визуально совместима с Card/Dialog/Menu, но не дублирует их UX.
- Docs содержат comparison table и примеры корректного выбора компонента.
</done>

<questions></questions>
