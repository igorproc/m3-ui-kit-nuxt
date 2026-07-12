# CalendarWeekly: high-priority pending view

<identity>Status: pending with parent · Priority: high · Vuetify `VCalendarWeekly` · private renderer</identity>

<problem>Week view combines seven locale-defined day columns with interval scrolling, all-day rows, event lanes and responsive overflow.</problem>

<candidate-contract>Consume root week range, normalized intervals/events/lanes, ids and intent callbacks. Slots customize day/interval/event content. No own range/model/fetch behavior.</candidate-contract>

<reuse>Root calendar context and the same event-geometry/date/scroll utilities as Daily. No parallel algorithm that can drift.</reuse>

<validation-gates>Locale first day, month/year boundaries, DST inside week, synchronized vertical scroll, horizontal responsive overflow, overlap lanes, keyboard two-dimensional navigation and SSR labels.</validation-gates>

<accessibility>Day headers expose weekday/date; interval/event cells expose both day and time; responsive scrolling preserves logical focus order.</accessibility>

<promotion-gate>Promotes only with root, Daily and shared geometry foundations as one reviewed family.</promotion-gate>

