<template>
  <div class="crm-new-deal-fields">
    <MAutocomplete
      class="crm-new-deal-fields__wide"
      :model-value="extras.companyId"
      :items="CRM_COMPANIES"
      item-value="id"
      label="Компания"
      placeholder="Начните вводить название"
      label-placement="top"
      required
      clearable
      :error-message="errors.company"
      @update:model-value="onCompany"
    >
      <template #no-results="{ query }">
        <p class="crm-new-deal-fields__state">
          Компания «{{ query }}» не найдена
        </p>
      </template>
    </MAutocomplete>

    <MDropdown
      :model-value="extras.stage"
      :items="STAGE_ITEMS"
      item-value="id"
      label="Этап"
      label-placement="top"
      @update:model-value="onStage"
    />

    <MNumberInput
      v-model="extras.amount"
      label="Сумма"
      label-placement="top"
      locale="ru-RU"
      unit="₽"
      :min="0"
      :step="50000"
      required
      :error-message="errors.amount"
      increment-label="Увеличить сумму"
      decrement-label="Уменьшить сумму"
    />

    <CrmDateField
      v-model="extras.closeDate"
      label="Дата закрытия"
      :min="CRM_TODAY"
    />

    <MTimePicker
      v-model="extras.meetingTime"
      mode="input"
      label="Время встречи"
      aria-label="Время встречи"
      hour-cycle="h23"
      locale="ru-RU"
      hour-label="Часы"
      minute-label="Минуты"
      period-label="До или после полудня"
      hour-error="Часы — от 0 до 23"
      minute-error="Минуты — от 0 до 59"
    />

    <div class="crm-new-deal-fields__tags">
      <p
        :id="tagsLabelId"
        class="crm-new-deal-fields__label"
      >
        Метки
      </p>
      <MChipGroup
        :model-value="extras.tags"
        multiple
        :aria-labelledby="tagsLabelId"
        @update:model-value="onTags"
      >
        <MChip
          v-for="tag in CRM_TAGS"
          :key="tag.id"
          :value="tag.id"
          type="filter"
        >
          {{ tag.label }}
        </MChip>
      </MChipGroup>
    </div>

    <MColorInput
      v-model="extras.color"
      label="Цвет меток"
      label-placement="top"
      :formats="['hex']"
      :swatches="SWATCHES"
      clearable
      picker-label="Выбрать цвет меток"
      :picker-messages="PICKER_MESSAGES"
      format-hint="Цвет в формате #RRGGBB"
    />

    <MTextarea
      v-model="extras.notes"
      class="crm-new-deal-fields__wide"
      label="Заметки"
      :rows="3"
      :max-rows="6"
      auto-grow
      :maxlength="500"
      counter
      resize-label="Изменить высоту поля"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { MColorPickerMessages } from '#kit/components/ui/color-picker/props'
import type { ColorSwatch } from '#kit/shared/utils/color'
import { CRM_TODAY } from '../data/crmFormat'
import { CRM_COMPANIES } from '../data/crmSeed'
import { CRM_STAGES, CRM_TAGS } from '../data/crmTypes'
import type { CrmStageId, CrmTagId } from '../data/crmTypes'
import { useCrmNewDealForm } from '../composables/useCrmNewDeal'
import CrmDateField from './CrmDateField.vue'

const STAGE_ITEMS = CRM_STAGES.filter(stage => stage.id !== 'won').map(stage => ({ id: stage.id, label: stage.label }))

const SWATCHES: ColorSwatch[] = [
  { value: '#6750A4', label: 'Фиолетовый' },
  { value: '#0B57D0', label: 'Синий' },
  { value: '#146C2E', label: 'Зелёный' },
  { value: '#B3261E', label: 'Красный' },
  { value: '#8C5000', label: 'Охра' },
]

const PICKER_MESSAGES: MColorPickerMessages = {
  saturation: 'Насыщенность',
  brightness: 'Яркость',
  hue: 'Оттенок',
  alpha: 'Прозрачность',
  value: 'Значение цвета',
  format: 'Формат',
  channels: 'Каналы цвета',
  swatches: 'Палитра',
  formatHint: 'Цвет в формате #RRGGBB',
}

const { extras, errors } = useCrmNewDealForm()
const tagsLabelId = useId()

const isStage = (value: unknown): value is CrmStageId => CRM_STAGES.some(stage => stage.id === value)
const isTag = (value: unknown): value is CrmTagId => CRM_TAGS.some(tag => tag.id === value)

// The selection family is generic over the item type, but its props are a
// runtime object, so the emitted value is untyped and narrowed here.
function onCompany(value: unknown) {
  extras.companyId = typeof value === 'string' ? value : null
}

function onStage(value: unknown) {
  if (isStage(value)) extras.stage = value
}

function onTags(value: unknown) {
  extras.tags = Array.isArray(value) ? value.filter(isTag) : []
}
</script>

<style lang="scss">
.crm-new-deal-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240rem, 1fr));
  gap: spacing(16);

  &__wide,
  &__tags {
    grid-column: 1 / -1;
  }

  &__tags {
    display: grid;
    gap: spacing(8);
  }

  &__label {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-small');
  }

  &__state {
    margin: 0;
    padding: spacing(12) spacing(16);
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
