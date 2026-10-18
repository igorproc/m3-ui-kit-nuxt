<template>
  <MChipGroup
    class="crm-owner-filter"
    :model-value="owners"
    multiple
    aria-label="Фильтр по ответственным"
    @update:model-value="onChange"
  >
    <MChip
      v-for="owner in CRM_OWNERS"
      :key="owner.id"
      :value="owner.id"
      type="filter"
    >
      <template #icon>
        <MAvatar
          :name="owner.name"
          alt=""
          density="compact"
        />
      </template>
      {{ shortName(owner.name) }}
    </MChip>
  </MChipGroup>
</template>

<script setup lang="ts">
import { shortName } from '../data/crmFormat'
import { CRM_OWNERS } from '../data/crmSeed'

const owners = defineModel<string[]>({ required: true })

// The chip group's props are a runtime object, so its model arrives untyped.
function onChange(value: unknown) {
  owners.value = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
</script>
