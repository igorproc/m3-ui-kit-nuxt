<template>
  <section class="fixture-stress">
    <h1>MTextarea — stress content</h1>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="empty"
        label="Describe the steps that reproduce the problem, the result you expected and what happened instead"
        data-test="long-label"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="empty"
        variant="outlined"
        label="Links"
        helper-text="https://example.com/a/very/long/path/without/any/spaces/at/all/that/never/breaks"
        data-test="long-word-helper"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="empty"
        label="Links"
        error-message="https://example.com/a/very/long/path/without/any/spaces/is/not/reachable"
        data-test="long-word-error"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="long"
        label="Capped"
        auto-grow
        :max-rows="4"
        data-test="capped"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="limited"
        label="Bio"
        counter
        :maxlength="40"
        data-test="near-limit"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="mixed"
        variant="outlined"
        label="Сообщение 消息 رسالة 🙂"
        data-test="mixed-script"
      >
        <template #footer>
          <MTextareaFooter>
            <MButton
              variant="text"
              data-test="send"
            >
              Send
            </MButton>
          </MTextareaFooter>
        </template>
      </MTextarea>
    </div>

    <div class="fixture-stress__narrow">
      <MTextarea
        v-model="toggled"
        label="Summary"
        :error-message="showError ? 'Write at least a sentence' : undefined"
        data-test="toggle-field"
      />
      <MButton
        data-test="toggle-error"
        @click="showError = !showError"
      >
        Toggle error
      </MButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MTextarea from '#kit/components/ui/textarea/index.vue'
import MTextareaFooter from '#kit/components/ui/textarea/footer.vue'

const empty = ref('')
const long = ref(Array.from({ length: 20 }, (_, i) => `Line ${i + 1} of a value that runs past the cap`).join('\n'))
const limited = ref('')
const mixed = ref('Сохранить 保存 حفظ 🙂')
const toggled = ref('')
const showError = ref(false)
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    display: grid;
    gap: 8rem;
    width: min(280rem, 100%);
  }
}
</style>
