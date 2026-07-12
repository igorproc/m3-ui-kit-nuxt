# MSparkline

<lab-status>Deferred to paid charts lab. This is the candidate public foundation for compact line/bar/area visualization; exact product packaging and paid boundary require review.</lab-status>
<identity>VSparkline · MSparkline · Phase 5 · public</identity>
<problem>Нужна компактная line-визуализация тренда числового ряда с опциональной точкой-хайлайтом и hover-значением.</problem>
<solution>SVG line sparkline со smooth/linear интерполяцией; SparklineTooltip — private hover leaf. Форматирование данных остаётся у потребителя.</solution>
<api>Props: `model: number[]`, `smooth?`, `gradient?`, `fill?`, `min?`, `max?`, `autoDraw?`, `color?: surface role`, `showTooltip?`. Slots: tooltip. Emits: `hover(index)`.</api>
<composition>Provides sparkline context точке/тултипу; один computed path из viewBox, без fetch/store.</composition>
<reuse>M3 color/shape/motion tokens, общий scale utility (с barline), `useEventListener`/`useResizeObserver`. Не подключать charting lib и не вешать raw pointer listeners.</reuse>
<styles>`components/sparkline/_index.scss` `$tokens`: stroke, gradient stops, fill opacity, point, draw motion, reduced-motion.</styles>
<ux>`role=img` с summary; hover/focus по точкам keyboard-доступен; reduced-motion отключает draw-in.</ux>
<dx>Данные — числовой массив; gradient — semantic roles, не hex; SSR рендерит финальный path.</dx>
<tests>Smooth/linear path, gradient/fill, hover index, SSR frame, reduced-motion, aria.</tests>
<done>Спарклайн синхронизирует path, точку и tooltip из одного источника.</done>
<questions>Выбрать дефолт интерполяции: smooth или linear.</questions>
