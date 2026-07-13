<script setup lang="ts">
import type { ItemFormState } from '~/types/excelConfirmacion'
import { calcItemTotal, formatUsd } from '~/utils/itemForm'

const props = defineProps<{
  item: ItemFormState
  labels: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:item': [ItemFormState]
  remove: []
}>()

const FOTO_MIN_HEIGHT = 'min-h-44'

const localItem = computed({
  get: () => props.item,
  set: (value) => emit('update:item', value)
})

const total = computed(() => calcItemTotal(localItem.value))
const formattedTotal = computed(() => formatUsd(total.value))
const cleanLabel = (label: string) => label.replace(/:$/, '').trim()

const caracteristicasFilled = computed(() =>
  props.labels.filter((l) => String(localItem.value.caracteristicas[l] || '').trim()).length
)

const updateField = <K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) => {
  if (props.readonly) return
  localItem.value = { ...localItem.value, [key]: value }
}

const updateCaracteristica = (label: string, value: string) => {
  if (props.readonly) return
  localItem.value = {
    ...localItem.value,
    caracteristicas: { ...localItem.value.caracteristicas, [label]: value }
  }
}

const fotoFile = ref<File | null>(null)

const onFotoChange = (files: File | File[] | null | undefined) => {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) {
    fotoFile.value = null
    updateField('foto_url', '')
    return
  }
  fotoFile.value = file
  const reader = new FileReader()
  reader.onload = () => updateField('foto_url', String(reader.result || ''))
  reader.readAsDataURL(file)
}

const clearFoto = () => {
  fotoFile.value = null
  updateField('foto_url', '')
}
</script>

<template>
  <div class="divide-y divide-gray-100">
    <section class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-stretch">
        <!-- Col 1: foto a altura completa -->
        <div class="w-full h-full flex flex-col" :class="FOTO_MIN_HEIGHT">
          <div
            v-if="localItem.foto_url"
            class="relative w-full h-full flex-1 flex items-center justify-center rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group"
            :class="FOTO_MIN_HEIGHT"
          >
            <img
              :src="localItem.foto_url"
              alt="Producto"
              class="max-w-full max-h-full w-auto h-auto object-contain"
            >
            <button
              v-if="!readonly"
              type="button"
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              @click="clearFoto"
            >
              <UIcon name="i-heroicons-trash" class="size-5 text-white" />
            </button>
          </div>
          <UFileUpload
            v-else-if="!readonly"
            :model-value="fotoFile"
            accept="image/*"
            label="Foto"
            description="JPG, PNG"
            icon="i-heroicons-camera"
            class="w-full h-full flex-1"
            :ui="{
              root: 'h-full flex-1',
              base: `h-full flex-1 ${FOTO_MIN_HEIGHT} items-center justify-center`,
              wrapper: 'h-full flex flex-col items-center justify-center text-center'
            }"
            @update:model-value="onFotoChange"
          />
          <div
            v-else
            class="w-full h-full flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400"
            :class="FOTO_MIN_HEIGHT"
          >
            Sin foto
          </div>
        </div>

        <!-- Col 2: datos en 2 columnas -->
        <div class="min-w-0 grid grid-cols-2 gap-x-3 gap-y-3">
          <UFormField label="Nombre comercial" required class="col-span-2 w-full">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.nombre_comercial"
              placeholder="Nombre del producto"
              @update:model-value="updateField('nombre_comercial', $event)"
            />
          </UFormField>

          <UFormField label="HS Code" class="w-full min-w-0">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.hs_code"
              placeholder="6403.99.00"
              @update:model-value="updateField('hs_code', $event)"
            />
          </UFormField>

          <UFormField label="Link del producto" class="w-full min-w-0">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.link_producto"
              type="url"
              placeholder="https://..."
              @update:model-value="updateField('link_producto', $event)"
            />
          </UFormField>

          <UFormField label="Cantidad" required class="w-full min-w-0">
            <UInput
              v-model.number="localItem.qty"
              class="w-full"
              :disabled="readonly"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
            />
          </UFormField>

          <UFormField label="Precio EXW" required class="w-full min-w-0">
            <UInput
              v-model.number="localItem.precio_unitario"
              class="w-full"
              :disabled="readonly"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
            />
          </UFormField>

          <UFormField label="Total USD" class="col-span-2 w-full">
            <div
              class="w-full h-9 flex items-center justify-end px-3 rounded-md border text-sm font-semibold"
              :class="total > 0 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-400'"
            >
              ${{ formattedTotal }}
            </div>
          </UFormField>
        </div>
      </div>
    </section>

    <section v-if="labels.length" class="px-4 pb-4">
      <FormSection
        title="Características"
        :badge="`${caracteristicasFilled}/${labels.length}`"
        icon="i-heroicons-adjustments-horizontal"
        collapsible
        :default-open="false"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <UFormField
            v-for="label in labels"
            :key="label"
            :label="cleanLabel(label)"
            class="w-full min-w-0"
          >
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="item.caracteristicas[label] || ''"
              placeholder="—"
              size="sm"
              @update:model-value="updateCaracteristica(label, $event)"
            />
          </UFormField>
        </div>
      </FormSection>
    </section>

    <div v-if="item.isNew && !readonly" class="px-4 pb-4 flex justify-end">
      <UButton color="error" variant="ghost" size="sm" icon="i-heroicons-trash" @click="emit('remove')">
        Eliminar
      </UButton>
    </div>
  </div>
</template>
