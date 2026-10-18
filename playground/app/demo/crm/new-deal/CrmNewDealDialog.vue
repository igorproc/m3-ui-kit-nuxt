<template>
  <MDialog
    v-model="store.newDealOpen.value"
    title="Новая сделка"
  >
    <!-- MDialog has no height cap and no scrolling body: a long form would
         overflow the viewport, so this wrapper scrolls. -->
    <div class="crm-new-deal">
      <!-- `novalidate`: the renderer's form leaves it off, and the browser's
           own bubbles would pre-empt the adapter's messages. -->
      <MFormRenderer
        class="crm-new-deal__form"
        :config="CRM_NEW_DEAL_SCHEMA"
        :on-submit="form.submit"
        aria-label="Новая сделка"
        novalidate
      >
        <!-- The default slot is the renderer's only extension point, and it
             sits in the actions row: the fields the schema cannot express are
             composed here, after the rendered ones. -->
        <template #default="{ pending }">
          <div class="crm-new-deal__extra">
            <CrmNewDealFields />

            <div class="crm-new-deal__actions">
              <MButton
                variant="text"
                @click="store.newDealOpen.value = false"
              >
                Отмена
              </MButton>
              <MButton
                type="submit"
                :loading="pending"
                @click="form.attempted.value = true"
              >
                Создать сделку
              </MButton>
            </div>
          </div>
        </template>
      </MFormRenderer>
    </div>
  </MDialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { veeValidateAdapter } from '#kit/adapters/vee-validate'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import { CRM_NEW_DEAL_SCHEMA, provideCrmNewDeal, useCrmNewDeal } from '../composables/useCrmNewDeal'
import { useCrmStore } from '../composables/useCrmStore'
import CrmNewDealFields from './CrmNewDealFields.vue'

// `MFormRenderer` throws without an engine behind it.
provideValidationAdapter(veeValidateAdapter())

const store = useCrmStore()
const form = useCrmNewDeal(store)
provideCrmNewDeal(form)

watch(() => store.newDealOpen.value, (open) => {
  if (open) form.reset()
})
</script>

<style lang="scss">
.crm-new-deal {
  max-height: calc(100dvh - 220rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-inline-end: spacing(4);

  // The renderer's actions row is where the slot lands; the extra block
  // takes the whole row.
  &__extra {
    display: grid;
    flex: 1 1 100%;
    gap: spacing(16);
    min-width: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: spacing(8);
  }
}
</style>
