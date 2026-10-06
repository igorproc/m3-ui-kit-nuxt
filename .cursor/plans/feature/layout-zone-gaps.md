# Layout zone gaps / islands

<identity>Area: `m-layout` auto-layout (carve engine) · Status: proposed · Trigger: consumer needs floating "island" zones (rail/aside/main as separate cards with spacing)</identity>

<problem>The carve engine cuts zones edge-to-edge: `grid-template-areas/columns/rows` have no gaps, and side zones are sized to exactly their `sizeToken`. A consumer cannot render zones as spaced islands, because `padding`/`margin` inside a token-sized track either clips the child or overflows, and the sticky height `calc(100dvh - top - bottomSticky)` leaves no room for top/bottom insets. There is no first-class spacing primitive between zones.</problem>

<current-workaround>Wrap the self-registering zone (e.g. `m-navigation-rail`) in a generic `m-layout-aside` and pad it, sizing the wrapper relative to the child's own width token so propagation is preserved and no magic number appears: `size-token="calc(var(--ui-navigation-rail-width) + 32rem)"` + inner `padding: 16rem` + card styling on the child. Right/left window gaps are then juggled between zone padding and `m-layout-main` stage padding to avoid non-collapsing double gaps. Works, but it is a per-consumer trick and easy to get wrong.</current-workaround>

<solution>Give `m-layout` a first-class `gap` (uniform) with optional per-zone `inset` overrides. The carve engine inserts the gap into the generated `grid-template` (gutters between tracks + an outer margin from the viewport edges) and folds it into the per-item sticky math, so zones render as islands with zero extra consumer CSS.</solution>

<api>`<m-layout gap="16rem">` — a token name or raw size, default `0` (current behavior unchanged). Optional per-zone `inset` on `m-layout-aside`/`-header`/`-footer`/`-item` to override the shared gap. Corner radius / card surface stay a consumer styling concern (tokens), not part of this contract.</api>

<reuse>`composables/layout/carve.ts` (`carve`, `buildLayoutCss`, `stickyDecls`, `itemInsetVar`, `sizeVar`, the `--m3-layout-inset-*` totals) and `useLayout.ts` (`normalizeSize`, contribution summing). No new registry; gap threads through the existing per-range grid generation.</reuse>

<validation-gates>Sticky top/bottom (`position: fixed`) offsets must include the gap so content does not jump; start/end height becomes `calc(100dvh - top - bottomSticky - gap*2)`; logical properties kept for RTL; the mobile/tablet ranges that drop side zones must not leave orphan gutters; `full-height` scroll container still owns overflow; zero CLS (all geometry stays in the generated `<style>`, no measurement). Test with rail + end panel + main, panel collapsing 0↔open, and multiple zones on one edge.</validation-gates>

<accessibility>Purely visual spacing; no semantics change. Focus order and landmarks unaffected.</accessibility>

<done>A consumer sets one `gap` on `m-layout` and every zone renders as a spaced island with matching heights, replacing the `calc(var(--zone-width) + 2*gap)` + inner-padding workaround.</done>

<questions>Uniform `gap` vs per-edge control first? Does the gap apply above the top app-bar (window ↔ bar) or only between the bar and the content zones? Should corner-radius be a layout token so islands round consistently, or stay fully consumer-owned?</questions>
