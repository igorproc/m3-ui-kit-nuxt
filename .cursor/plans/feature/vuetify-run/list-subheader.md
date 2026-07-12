# MListSubheader

<identity>
Vuetify reference: `VListSubheader` · PrimeTime target: `MListSubheader` · Phase: 3 · Type: public
</identity>

<status>
Discussed and approved as the only missing list-family role. `MListGroup` and `ListChildren` are already covered by the existing `MList`/`MListItem` implementation and are removed from the new-capability delta.
</status>

<problem>
Long lists need visible noninteractive section labels such as “Recent”, “Archived” or date/category group headings. Recreating them from arbitrary text produces inconsistent padding, typography, semantics and sticky behavior relative to list items.
</problem>

<solution>
`MListSubheader` is a small passive list-family heading with text/slot content and optional sticky presentation. It owns no item registry, selection, expansion, routing or list context.

Non-goals:

- no collapse/expand behavior;
- no selection or current state;
- no action/click API;
- no automatic grouping of items;
- no observer/sticky offset calculation;
- no heading-level inference.
</solution>

<api>
```ts
export type MListSubheaderTag = 'div' | 'li' | 'p'

export interface MListSubheaderProps {
  title?: string
  tag?: MListSubheaderTag
  sticky?: boolean
  inset?: boolean
}
```

Defaults: `tag: 'div'`, `sticky: false`, `inset: false`. The default slot overrides `title`. No model, emits or expose API.
</api>

<composition>
```text
MList
├── MListSubheader
├── MListItem
├── MListItem
├── MListSubheader
└── MListItem
```

The component is independently usable inside a semantic list chosen by the consumer. It does not inject `MList` because it has no shared state or registration requirement. `inset` aligns the label with list-item body text when items have leading media.
</composition>

<reuse>
Reuse list-family spacing/typography/surface roles and logical layout conventions. Sticky placement uses native CSS. Do not create context, expansion tickets, selection state, raw scroll listeners or duplicate list item markup.
</reuse>

<semantics>
The subheader is visible structural text, not an interactive control. It is not focusable and receives no button/listitem role automatically. `tag="li"` is available when the consumer's list markup requires a direct list child; otherwise the neutral default avoids invalid assumptions about the parent tag.

The default title renders as text with subheader typography, not a hardcoded `h2/h3`, because the component cannot infer document outline level. Consumers needing a real heading provide it through the default slot:

```vue
<MListSubheader>
  <h3>Архив</h3>
</MListSubheader>
```

Visual typography must remain consistent for slotted headings via documented reset/inheritance rules.
</semantics>

<sticky>
`sticky=true` uses `position: sticky` at the local scroll container's block start with a tokenized surface and stacking layer. It does not inspect app bars, layout registry or viewport offsets. If the entire list participates in application layout carving, the consumer composes that at the container level.

Sticky remains CSS-only and SSR-safe. Consecutive subheaders replace each other naturally through native sticky flow; no IntersectionObserver announcements or scroll events are introduced.
</sticky>

<inset>
`inset=false` aligns with the list container's normal content edge. `inset=true` uses the canonical leading-media column offset so the label aligns with `MListItem` headline/body rather than its icon/avatar. The offset must be derived from shared/list tokens, not a copied literal.
</inset>

<styles>
Create `app/assets/stylesheet/components/list/subheader/_index.scss` or a nested list-family partial according to the established list token organization. The single nested `$tokens` map/branch covers min height, block/inline padding, inset offset, typography, foreground color, sticky surface, sticky elevation/divider and stacking value. There are no hover/focus/pressed/disabled states because the component is passive.

The SFC resolves all values through `material-map()`/`g()` and contains no literal component geometry/colors or runtime component-state variables.
</styles>

<ssr-and-lifecycle>
Tag, content and modifiers derive synchronously from props. Sticky is pure CSS. There are no listeners, observers, timers, client measurements or lifecycle hooks, so SSR and hydrated markup remain identical.
</ssr-and-lifecycle>

<dx>
```vue
<MList>
  <MListSubheader title="Последние" />

  <MListItem headline="Документ 1" />
  <MListItem headline="Документ 2" />

  <MListSubheader title="Архив" sticky />

  <MListItem headline="Документ 3" />
</MList>
```

```vue
<MListSubheader inset>
  Избранные
</MListSubheader>
```
</dx>

<edge-cases>
- Empty title/slot renders no misleading accessible label and may produce a development diagnostic.
- Long localized labels wrap or truncate only according to explicit family token policy; full text must remain available.
- Sticky inside a non-scrolling parent behaves like ordinary native sticky without JS fallback.
- `li` tag does not add an extra nested listitem role.
- Slotted heading margins are normalized so geometry matches text-prop rendering.
- RTL uses logical padding and inset alignment.
</edge-cases>

<tests>
Default/title/slot precedence; tag variants; passive/nonfocusable semantics; sticky modifier/surface; inset alignment against list items with leading media; empty and long content; slotted heading normalization; RTL; SSR/hydration; light/dark tokens; lint and stylelint.
</tests>

<done>
List sections receive a consistent, semantic and optionally sticky label without new state, context or interaction infrastructure.
</done>

<questions>
None.
</questions>

