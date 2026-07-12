# CalendarDaily: high-priority pending view

<identity>Status: pending with parent · Priority: high · Vuetify `VCalendarDaily` · private renderer</identity>

<problem>A day timeline needs timezone/DST-safe intervals, all-day placement, current-time marker and overlapping event lanes.</problem>

<candidate-contract>Consume one root range/date, normalized intervals/events/lanes and intent callbacks. Slots customize interval/day/event visuals. No own model or event persistence.</candidate-contract>

<reuse>Root calendar context, validated date utilities, shared daily/weekly geometry, scroll/RAF and family tokens.</reuse>

<validation-gates>23/24/25-hour days, skipped/repeated local times, all-day boundaries, now-marker scheduling/cleanup, overlap stability, scroll-to-time and keyboard interval navigation.</validation-gates>

<accessibility>Intervals/events expose usable time labels; event traversal does not require spatial inference; now marker is visual unless explicitly announced.</accessibility>

<promotion-gate>Promotes only with the root and approved timezone/geometry contracts.</promotion-gate>

