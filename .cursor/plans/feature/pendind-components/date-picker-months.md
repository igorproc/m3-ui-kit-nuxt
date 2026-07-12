# DatePickerMonths: pending product need

<identity>
Status: pending discussion · Vuetify reference: `VDatePickerMonths` · Candidate target: private `DatePickerMonths` leaf of `MDatePicker`
</identity>

<reason-for-pending>
В kit уже существует полноценный `MDatePicker` с day/year views, `HeaderNav`, `DayGrid`, `YearGrid`, локализованной date-логикой и min/max navigation. Отдельная сетка выбора месяца сейчас не закрывает подтверждённую пользовательскую задачу, поэтому расширять state machine и HeaderNav только ради покрытия `VDatePickerMonths` нецелесообразно.
</reason-for-pending>

<activation-gate>
Вернуть план в активный roadmap только после появления реального сценария, где последовательная навигация по месяцам неудобна: выбор месяца без дня, быстрый переход на далёкий месяц или month-first flow. Перед реализацией нужно решить, является ли это private navigation view существующего picker либо отдельным month-value режимом; второй вариант нельзя маскировать под простой leaf.
</activation-gate>

<candidate-scope>
Если потребность подтвердится, private month grid расширяет существующий date-picker state до `calendar | month | year`, использует единый `displayDate` и не получает собственного public model. Сетка содержит 12 локализованных месяцев, учитывает min/max, поддерживает roving focus и возвращает пользователя в calendar view после выбора.
</candidate-scope>

<reuse>
`MDatePicker`, `DatePickerHeaderNav`, `DatePickerDayGrid`, `DatePickerYearGrid` и `useDatePicker`. Не создавать отдельный date state, parser, locale pipeline или второй picker API.
</reuse>

<decision-needed>
1. Есть ли подтверждённый month-selection или long-range navigation сценарий.
2. Нужен ли выбор месяца как значения либо только как промежуточная навигация к дню.
3. Как HeaderNav явно открывает month/year views без скрытого трёхсостоянийного цикла.
</decision-needed>

