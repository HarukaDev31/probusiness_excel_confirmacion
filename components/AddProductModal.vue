<script setup lang="ts">
const props = defineProps<{
  tipos: string[]
  labelsForTipo: (tipo: string) => string[]
}>()

const open = defineModel<boolean>('open', { default: false })
const selectedTipo = ref('')

const tipoOptions = computed(() =>
  props.tipos.map((tipo) => ({
    label: tipo,
    value: tipo,
    description: `${props.labelsForTipo(tipo).length} características`
  }))
)

const selectedLabelsCount = computed(() =>
  selectedTipo.value ? props.labelsForTipo(selectedTipo.value).length : 0
)

watch(open, (isOpen) => {
  if (isOpen && !selectedTipo.value && props.tipos.length) {
    selectedTipo.value = props.tipos[0]
  }
  if (!isOpen) selectedTipo.value = ''
})

const emit = defineEmits<{ confirm: [tipo: string] }>()

const confirm = () => {
  if (!selectedTipo.value) return
  emit('confirm', selectedTipo.value)
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nuevo producto"
    description="El rubro define qué características debes completar"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Tipo de producto (rubro)" required>
          <USelect
            v-model="selectedTipo"
            :items="tipoOptions"
            placeholder="Selecciona un rubro"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="selectedTipo"
          icon="i-heroicons-information-circle"
          color="primary"
          variant="soft"
          :title="`${selectedLabelsCount} características a completar`"
          :description="`Rubro: ${selectedTipo}. Podrás editar nombre, foto, precios y más después de agregar.`"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">Cancelar</UButton>
        <UButton color="primary" icon="i-heroicons-plus" :disabled="!selectedTipo" @click="confirm">
          Agregar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
