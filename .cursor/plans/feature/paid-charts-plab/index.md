# Paid charts lab

<identity>
Status: separate product/architecture lab · Scope: compact paid visualization capabilities originally discovered through Vuetify sparkline parity
</identity>

<purpose>
Design compact chart capabilities as one coherent geometry, interaction, accessibility and commercial surface rather than four unrelated UI components. This lab is outside the active `vuetify-run` roadmap until product packaging and technical boundaries are approved.
</purpose>

<included-plans>
- [`MBarline`](barline.md)
- [`MSparkline`](sparkline/index.md)
- [`SparklineTooltip`](sparkline/tooltip.md), private/dependent
- [`MTrendline`](trendline.md)
</included-plans>

<primary-review-gate>
Decide whether public API is one `MSparkline` with `type: line|bar|area` or separate Barline/Sparkline/Trendline exports. Preferred technical direction is one geometry/domain system and no duplicated SVG math regardless of product packaging.
</primary-review-gate>

<foundation-boundary>
Shared pure utilities own numeric normalization, domain/baseline, points, monotone/linear path, bars, area closure and nearest-point lookup. Fixed SVG viewBox should avoid ResizeObserver for geometry. Tooltip state remains local/direct-prop, not a provided context or overlay stack.
</foundation-boundary>

<data-contract-review>
Prefer readonly `data` rather than model because charts do not edit input. Review number versus `{ value, label }` records, formatters, semantic color roles, invalid/empty/constant datasets and explicit min/max clipping diagnostics.
</data-contract-review>

<accessibility-review>
Require meaningful `ariaLabel` or explicit decorative mode. Interactive tooltip should use one chart focus target with point navigation rather than one Tab stop per datum. Define accessible current-value description and ensure visuals never become the only carrier of business meaning.
</accessibility-review>

<motion-review>
Animation is opt-in and reduced-motion aware. SSR renders final stable geometry without CLS. Repeated chart instances must not create observer/listener/timer storms.
</motion-review>

<chart-library-boundary>
The lab covers microcharts without axes, legends, zoom, multiple series, annotations or complex scales. When those requirements appear, adopt/integrate a real charting library rather than growing a custom framework.
</chart-library-boundary>

<commercial-gate>
Before implementation, decide which utilities remain internal/core, which public components belong to the paid package, package/plugin boundaries, docs/demo exposure, licensing and graceful behavior when the paid module is absent.
</commercial-gate>

<promotion-gate>
Promote only after public packaging, consolidated-vs-separate API, shared geometry, accessibility and chart-library boundaries are approved together.
</promotion-gate>

