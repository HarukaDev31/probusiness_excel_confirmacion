<script setup lang="ts">
import type { ClientMessage, ClientMessageTone } from '~/utils/clientApiError'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    message?: ClientMessage | null
    confirmLabel?: string
  }>(),
  {
    confirmLabel: 'Entendido'
  }
)

const toneConfig = computed<Record<ClientMessageTone, { color: 'error' | 'warning' | 'info' | 'success'; icon: string; ring: string }>>(() => ({
  error: {
    color: 'error',
    icon: 'i-heroicons-exclamation-triangle',
    ring: 'bg-error-50 text-error-600 ring-error-100'
  },
  warning: {
    color: 'warning',
    icon: 'i-heroicons-exclamation-circle',
    ring: 'bg-warning-50 text-warning-600 ring-warning-100'
  },
  info: {
    color: 'info',
    icon: 'i-heroicons-information-circle',
    ring: 'bg-info-50 text-info-600 ring-info-100'
  },
  success: {
    color: 'success',
    icon: 'i-heroicons-check-circle',
    ring: 'bg-success-50 text-success-600 ring-success-100'
  }
}))

const activeTone = computed(() => toneConfig.value[props.message?.tone ?? 'error'])
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="true"
    :ui="{ content: 'max-w-md w-full' }"
  >
    <template #header>
      <div class="flex items-start gap-3 min-w-0">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-full ring-4"
          :class="activeTone.ring"
        >
          <UIcon :name="activeTone.icon" class="size-6" />
        </div>
        <div class="min-w-0 pt-0.5">
          <p class="text-base font-semibold text-gray-900 leading-snug">
            {{ message?.title || 'Aviso' }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-gray-600 leading-relaxed">
        {{ message?.description || 'Ocurrió un inconveniente. Intenta nuevamente.' }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="primary" @click="open = false">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
