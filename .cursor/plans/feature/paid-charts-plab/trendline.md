# MTrendline

<lab-status>Deferred to paid charts lab. Review whether area/trend remains a public component or becomes `MSparkline type="area"` using the same path/domain system.</lab-status>
<identity>VSparkline (trend) · MTrendline · Phase 5 · public</identity>
<problem>Нужна area/trend-визуализация с заполнением под линией для акцента на направлении, а не на точечных значениях.</problem>
<solution>SVG trend area на базе sparkline-геометрии с обязательным gradient fill; focus на форме тренда, не на отдельных точках.</solution>
<api>Props: `model: number[]`, `smooth?`, `gradient?`, `min?`, `max?`, `autoDraw?`, `color?: surface role`, `padding?`. Slots: none. Emits: none.</api>
<composition>Переиспользует sparkline scale/path utility в area-режиме; без fetch/store.</composition>
<reuse>Общий scale/path utility со sparkline, M3 color/shape/motion tokens, `useResizeObserver`. Не дублировать path-математику и не подключать charting lib.</reuse>
<styles>`components/trendline/_index.scss` `$tokens`: line stroke, area gradient stops, baseline, draw motion, reduced-motion.</styles>
<ux>`role=img` с summary направления тренда; reduced-motion отключает draw-in; контраст area на surface.</ux>
<dx>Данные — числовой массив; gradient — semantic roles; SSR рендерит финальный кадр.</dx>
<tests>Area path, gradient, min-max, SSR frame, reduced-motion, aria.</tests>
<done>Trendline переиспользует sparkline-геометрию без копии математики.</done>
<questions>Зафиксировать, обязателен ли gradient или допустим сплошной fill.</questions>
