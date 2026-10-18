<template>
  <fieldset class="new-order-group">
    <legend class="new-order-group__legend">
      Доставка и оплата
    </legend>

    <div class="new-order-delivery__slot">
      <div class="new-order-delivery__date">
        <MDatePicker
          v-model="date"
          label="День доставки"
          input-title="Введите день доставки"
          locale="ru-RU"
          :min-date="minDate"
          :max-date="maxDate"
          prev-month-label="Предыдущий месяц"
          next-month-label="Следующий месяц"
          switch-to-year-label="Выбрать год"
          switch-to-day-label="Выбрать день"
          switch-to-input-label="Ввести дату с клавиатуры"
          switch-to-calendar-label="Выбрать дату в календаре"
          input-label="Дата"
          placeholder="ДД.ММ.ГГГГ"
          error-pattern="Дата не похожа на ДД.ММ.ГГГГ"
          error-range="Доставляем в ближайшие 30 дней"
        />
        <!-- MDatePicker has no error state of its own; the region stays mounted so it is announced. -->
        <p
          class="new-order-delivery__error"
          role="alert"
        >
          {{ errors.date }}
        </p>
      </div>

      <div class="new-order-delivery__time">
        <MTimePicker
          v-model="time"
          v-model:mode="timeMode"
          label="Время доставки"
          aria-label="Время доставки"
          helper-text="С 9:00 до 21:00"
          hour-cycle="h23"
          locale="ru-RU"
          hour-label="Часы"
          minute-label="Минуты"
          hour-error="Часы от 0 до 23"
          minute-error="Минуты от 0 до 59"
          required
          :error="Boolean(errors.time)"
          :error-message="errors.time"
        />
      </div>
    </div>

    <p
      id="new-order-payment"
      class="new-order-group__legend"
    >
      Способ оплаты
    </p>
    <MRadioGroup
      v-model="payment"
      class="new-order-delivery__payment"
      aria-labelledby="new-order-payment"
      mandatory
    >
      <MRadio
        v-for="method in PAYMENT_METHODS"
        :key="method"
        :value="method"
        :label="PAYMENT_LABELS[method]"
      />
    </MRadioGroup>

    <MCheckbox
      v-model="notify"
      label="Отправить покупателю SMS со ссылкой на отслеживание"
    />

    <MTextarea
      v-model="comment"
      label="Комментарий курьеру"
      placeholder="Код домофона, этаж, как найти подъезд"
      variant="outlined"
      :rows="2"
      :max-rows="5"
      auto-grow
      :maxlength="300"
      counter
    />

    <MFileUpload
      v-model="files"
      label="Вложения"
      hint="Счёт или доверенность, PDF или изображение до 5 МБ"
      accept=".pdf,image/*"
      :max-files="3"
      :max-size="5 * 1024 * 1024"
      :upload="simulateUpload"
      auto-start
      :messages="UPLOAD_MESSAGES"
    />
  </fieldset>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'
import type { FileUploadTaskContext } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MTimePickerMode } from '#kit/components/ui/time-picker/props'
import { TODAY, shiftDay, toPickerDate } from './data/calendar'
import { PAYMENT_LABELS } from './data/model'
import type { PaymentMethod } from './data/model'
import type { NewOrderErrors } from './useNewOrderDraft'

defineProps<{
  errors: NewOrderErrors
}>()

const date = defineModel<Date | null>('date', { required: true })
const time = defineModel<string>('time', { required: true })
const payment = defineModel<PaymentMethod>('payment', { required: true })
const notify = defineModel<boolean>('notify', { required: true })
const comment = defineModel<string>('comment', { required: true })
const files = defineModel<File[]>('files', { required: true })

const timeMode = ref<MTimePickerMode>('input')
const minDate = toPickerDate(shiftDay(TODAY, 1))
const maxDate = toPickerDate(shiftDay(TODAY, 30))

const PAYMENT_METHODS: PaymentMethod[] = ['card', 'cash', 'invoice']

const UPLOAD_MESSAGES: MFileUploadMessages = {
  drop: 'Перетащите файлы сюда',
  choose: 'Выбрать файлы',
  queue: 'Загруженные файлы',
  empty: 'Файлов пока нет',
  start: 'Загрузить',
  cancel: 'Отменить загрузку',
  retry: 'Повторить',
  remove: 'Удалить',
  status: { queued: 'В очереди', uploading: 'Загружается', success: 'Загружен', error: 'Ошибка', cancelled: 'Отменён' },
  reject: { type: 'нужен PDF или изображение', size: 'файл больше 5 МБ', count: 'не больше трёх файлов' },
  error: () => 'Не удалось загрузить файл',
}

const UPLOAD_STEP_MS = 200
const UPLOAD_STEPS = 8

/** Pretends to upload: progress in steps, cancelled with the signal the queue owns. */
function simulateUpload(_file: File, { signal, reportProgress }: FileUploadTaskContext): Promise<void> {
  return new Promise((resolve, reject) => {
    let step = 0
    const timer = setInterval(() => {
      step += 1
      reportProgress((step / UPLOAD_STEPS) * 100)
      if (step < UPLOAD_STEPS) return
      clearInterval(timer)
      resolve()
    }, UPLOAD_STEP_MS)

    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    }, { once: true })
  })
}
</script>

<style lang="scss">
.new-order-delivery {
  &__slot {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: spacing(16);
  }

  &__date {
    display: grid;
    gap: spacing(8);
  }

  &__time {
    flex: 1 1 220rem;
  }

  &__error {
    margin: 0;
    color: var(--md-sys-color-error);

    @include typescale('body-small');
  }

  &__payment {
    display: grid;
    gap: spacing(4);
  }
}
</style>
