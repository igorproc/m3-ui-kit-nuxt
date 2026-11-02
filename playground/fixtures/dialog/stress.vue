<template>
  <section class="fixture-dialog-stress">
    <h1>MDialog — stress content</h1>

    <div class="fixture-dialog-stress__row">
      <MButton
        v-for="item in cases"
        :key="item.id"
        variant="outlined"
        :data-test="`open-${item.id}`"
        @click="opened = item.id"
      >
        {{ item.id }}
      </MButton>
    </div>

    <MDialog
      :model-value="opened === 'tall'"
      title="Terms of service"
      data-test="dialog-tall"
      @update:model-value="close"
    >
      <p
        v-for="line in 30"
        :key="line"
        data-test="tall-line"
      >
        Clause {{ line }}: the service is provided as is, without any warranty of any kind.
      </p>
      <template #actions="{ confirm, cancel }">
        <MButton
          variant="text"
          data-test="tall-cancel"
          @click="cancel"
        >
          Decline
        </MButton>
        <MButton
          variant="text"
          data-test="tall-confirm"
          @click="confirm()"
        >
          Accept
        </MButton>
      </template>
    </MDialog>

    <MDialog
      :model-value="opened === 'long-word'"
      title="Supercalifragilisticexpialidociousandthensomemorewithoutanyspace"
      data-test="dialog-long-word"
      @update:model-value="close"
    >
      https://example.com/a/very/long/path/without/any/spaces/that/must/wrap/inside/the/dialog
    </MDialog>

    <MDialog
      :model-value="opened === 'stack'"
      title="Leave the workspace?"
      data-test="dialog-stack"
      @update:model-value="close"
    >
      You will lose access to every shared document.
      <template #actions="{ confirm, cancel }">
        <MButton
          variant="text"
          data-test="stack-cancel"
          @click="cancel"
        >
          Stay in the workspace and keep every document
        </MButton>
        <MButton
          variant="text"
          data-test="stack-confirm"
          @click="confirm()"
        >
          Leave the workspace and lose access to its documents
        </MButton>
      </template>
    </MDialog>

    <MDialog
      :model-value="opened === 'empty'"
      aria-label="Empty dialog"
      data-test="dialog-empty"
      @update:model-value="close"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'

const cases = [{ id: 'tall' }, { id: 'long-word' }, { id: 'stack' }, { id: 'empty' }]
const opened = ref('')

function close(open: boolean) {
  if (!open) opened.value = ''
}
</script>

<style lang="scss">
.fixture-dialog-stress {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }
}
</style>
