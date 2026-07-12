# SparklineTooltip

<lab-status>Deferred with MSparkline as its private interaction leaf. It is not an independently sellable/public capability.</lab-status>
<identity>VSparklineTooltip · SparklineTooltip · Phase 5 · sub</identity>
<problem>При hover/focus по точке спарклайна нужно показывать значение, не вводя второй overlay stack.</problem>
<solution>Private leaf читает активный индекс/значение из sparkline context и позиционирует лёгкий label у точки.</solution>
<api>Context-only: activeIndex, value, x, y, formatter. Slot props: `value`, `index`.</api>
<composition>Explicit child of MSparkline; активный индекс приходит из sparkline context.</composition>
<reuse>Sparkline context, существующий `MTooltip`/overlay positioning где нужно, M3 tokens. Не создавать параллельный z-index/overlay stack.</reuse>
<styles>Nested `components/sparkline/tooltip/_index.scss` `$tokens`: surface, typography, elevation, pointer offset.</styles>
<ux>Tooltip следует за keyboard-фокусом точки; не крадёт фокус; скрыт от AT, т.к. значение уже в summary.</ux>
<dx>Кастомный контент через parent tooltip slot; formatter наследуется из родителя.</dx>
<tests>Позиция по индексу, keyboard hover, formatter, скрытие.</tests>
<done>Tooltip не владеет собственным состоянием данных.</done>
<questions></questions>
