# MBarline

<lab-status>Deferred to paid charts lab. Before implementation, review whether this remains a public component or becomes `MSparkline type="bar"` sharing one geometry/accessibility system.</lab-status>
<identity>VSparkline (bar) · MBarline · Phase 5 · public</identity>
<problem>Нужна компактная inline bar-визуализация ряда чисел без подключения charting-библиотеки.</problem>
<solution>SVG bar mini-chart с автоскейлом и опциональными labels; данные и форматирование контролируются потребителем.</solution>
<api>Props: `model: number[]`, `max?`, `min?`, `gap?`, `rounded?`, `autoDraw?`, `color?: surface role`, `labels?`. Slots: label. Emits: none.</api>
<composition>Один computed layout из viewBox; без внутреннего fetch и store.</composition>
<reuse>M3 color/shape/motion tokens, `useResizeObserver`/`useRaf` для responsive и draw-in. Не подключать charting lib и не дублировать scale utility со sparkline.</reuse>
<styles>`components/barline/_index.scss` `$tokens`: bar fill (semantic role), gap, corner radius, label typography, reduced-motion.</styles>
<ux>`role=img` с осмысленным `aria-label`/summary; draw-анимация уважает reduced-motion; контраст баров на surface.</ux>
<dx>Данные — числовой массив; scale/format — чистые утилиты; SSR рендерит финальный кадр без анимации.</dx>
<tests>Scale/min-max, gap/rounded, SSR static frame, reduced-motion, aria label.</tests>
<done>Барлайн читаем, токенизирован и не вызывает layout shift.</done>
<questions>Зафиксировать дефолтную политику baseline: от нуля или от min ряда.</questions>
