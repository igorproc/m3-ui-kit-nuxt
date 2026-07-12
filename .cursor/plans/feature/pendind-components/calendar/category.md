# CalendarCategory: high-priority pending view

<identity>Status: pending with parent · Priority: high · Vuetify `VCalendarCategory` · private renderer</identity>

<problem>Resource/category calendars require labelled rows/columns, sticky resource headers, interval geometry and event placement without a second range/data model.</problem>

<candidate-contract>Consume normalized categories, visible range, intervals, event lanes, ids and intent actions from `MCalendar` context. Slots customize category/event content only. No model, fetch or independent public data API.</candidate-contract>

<reuse>Root context, shared daily/weekly event geometry, virtualization/scroll foundation and nested calendar tokens. No view-local normalization or listener registry.</reuse>

<validation-gates>Large category counts, sticky headers, bidirectional scroll synchronization, keyboard resource/time coordinates, dynamic category removal, event overlap and SSR geometry must be tested before final specification.</validation-gates>

<accessibility>Headers must expose both resource and time coordinates; virtualized rows retain coherent labels/indices; events remain reachable without pointer drag.</accessibility>

<promotion-gate>Promotes only with the root calendar and tested virtualization/grid foundations.</promotion-gate>

