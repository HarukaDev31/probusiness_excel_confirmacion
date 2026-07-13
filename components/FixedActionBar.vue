<script setup lang="ts">
defineProps<{
  saving?: boolean
  productCount?: number
  saveDisabled?: boolean
  addDisabled?: boolean
}>()

const emit = defineEmits<{
  save: []
  add: []
}>()
</script>

<template>
  <div class="fixed bottom-0 inset-x-0 z-30 safe-bottom">
    <div class="border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <p v-if="productCount !== undefined" class="hidden sm:block text-xs text-gray-500 shrink-0">
          {{ productCount }} producto{{ productCount === 1 ? '' : 's' }}
        </p>

        <div class="flex-1 flex gap-2 sm:justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-plus"
            class="flex-1 sm:flex-none"
            :disabled="addDisabled"
            @click="emit('add')"
          >
            <span class="sm:hidden">Agregar</span>
            <span class="hidden sm:inline">Agregar producto</span>
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-check"
            :loading="saving"
            :disabled="saveDisabled"
            class="flex-1 sm:flex-none font-semibold min-w-[140px]"
            @click="emit('save')"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
