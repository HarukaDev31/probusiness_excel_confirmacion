<script setup lang="ts">
import type { ItemFormState } from '~/types/excelConfirmacion'
import {
  calcItemTotal,
  formatMoneyWhileTyping,
  formatUsd,
  parseMoneyDraft,
  roundMoney
} from '~/utils/itemForm'
import {
  getCaracteristicaFieldConfig,
  getRequiredCaracteristicaValues,
  selectOptions,
  visibleCaracteristicaLabels
} from '~/utils/caracteristicaFields'
import { fetchImageBlobCors } from '~/utils/fotoCors'
import { isOptionalCaracteristica } from '~/utils/marcaModelo'

const props = defineProps<{
  item: ItemFormState
  labels: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:item': [ItemFormState]
  remove: []
}>()

const FOTO_MAX_HEIGHT = 'max-h-64'

const localItem = computed({
  get: () => props.item,
  set: (value) => emit('update:item', value)
})

const total = computed(() => calcItemTotal(localItem.value))
const formattedTotal = computed(() => formatUsd(total.value))

const visibleLabels = computed(() => visibleCaracteristicaLabels(props.labels))

const caracteristicasRequiredValues = computed(() =>
  getRequiredCaracteristicaValues(
    props.labels,
    localItem.value.caracteristicas,
    isOptionalCaracteristica
  )
)

const caracteristicasCompletas = computed(() => {
  const required = caracteristicasRequiredValues.value
  return (
    required.length === 0 ||
    required.every((value) => value !== null && value !== undefined && String(value).trim() !== '')
  )
})

const caracteristicasBadge = computed(() =>
  caracteristicasCompletas.value ? 'Listo' : 'Pendiente'
)

const caracteristicasBadgeColor = computed(() =>
  caracteristicasCompletas.value ? ('success' as const) : ('warning' as const)
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

const precioFocused = ref(false)
const precioDraft = ref('')

const precioDisplay = computed(() => {
  if (precioFocused.value) return precioDraft.value
  const value = localItem.value.precio_unitario
  if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
  return formatUsd(Number(value))
})

const onPrecioFocus = () => {
  if (props.readonly) return
  precioFocused.value = true
  const value = localItem.value.precio_unitario
  precioDraft.value =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? ''
      : formatMoneyWhileTyping(value)
}

const onPrecioInput = (raw: string | number) => {
  if (props.readonly) return
  const formatted = formatMoneyWhileTyping(raw)
  precioDraft.value = formatted
  updateField('precio_unitario', parseMoneyDraft(formatted))
}

const onPrecioBlur = () => {
  precioFocused.value = false
  const value = localItem.value.precio_unitario
  if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
    updateField('precio_unitario', roundMoney(Number(value)))
  }
  precioDraft.value = ''
}

const toast = useToast()
const fotoFile = computed(() => localItem.value.foto_file ?? null)
const previewOpen = ref(false)
const copyingFoto = ref(false)

const revokeIfBlob = (url: string) => {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}

const onFotoChange = (files: File | File[] | null | undefined) => {
  if (props.readonly) return
  const file = Array.isArray(files) ? files[0] : files
  const prevUrl = String(localItem.value.foto_url || '')
  if (!file) {
    revokeIfBlob(prevUrl)
    localItem.value = { ...localItem.value, foto_file: null, foto_url: '' }
    return
  }
  revokeIfBlob(prevUrl)
  localItem.value = {
    ...localItem.value,
    foto_file: file,
    foto_url: URL.createObjectURL(file)
  }
}

const clearFoto = () => {
  if (props.readonly) return
  previewOpen.value = false
  revokeIfBlob(String(localItem.value.foto_url || ''))
  localItem.value = { ...localItem.value, foto_file: null, foto_url: '' }
}

const openFotoPreview = () => {
  if (!localItem.value.foto_url) return
  previewOpen.value = true
}

const blobToPng = async (blob: Blob): Promise<Blob> => {
  if (blob.type === 'image/png') return blob
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el canvas')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('No se pudo convertir a PNG'))),
      'image/png'
    )
  })
}

const copyFoto = async () => {
  const url = String(localItem.value.foto_url || '')
  if (!url || copyingFoto.value) return

  copyingFoto.value = true
  try {
    const source = localItem.value.foto_file ?? (await fetchImageBlobCors(url))
    const png = await blobToPng(source)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
    toast.add({ title: 'Imagen copiada', color: 'success' })
  } catch (error) {
    console.error('[copyFoto]', error)
    toast.add({
      title: 'No se pudo copiar la imagen',
      description: 'Intenta de nuevo o limpia la caché del sitio',
      color: 'error'
    })
  } finally {
    copyingFoto.value = false
  }
}
</script>

<template>
  <div class="divide-y divide-gray-100">
    <section class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-start">
        <div class="w-full min-w-0">
          <div
            v-if="localItem.foto_url"
            class="relative w-full flex items-center justify-center rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group max-h-64"
          >
            <img
              :src="localItem.foto_url"
              alt="Producto"
              class="max-w-full max-h-64 w-auto h-auto object-contain"
            >
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            >
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Ampliar"
                aria-label="Ampliar imagen"
                @click="openFotoPreview"
              >
                <UIcon name="i-heroicons-magnifying-glass-plus" class="size-5" />
              </button>
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Copiar imagen"
                aria-label="Copiar imagen"
                :disabled="copyingFoto"
                @click="copyFoto"
              >
                <UIcon name="i-heroicons-clipboard-document" class="size-5" />
              </button>
              <button
                v-if="!readonly"
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Quitar foto"
                aria-label="Quitar foto"
                @click="clearFoto"
              >
                <UIcon name="i-heroicons-trash" class="size-5" />
              </button>
            </div>
          </div>
          <UFileUpload
            v-else-if="!readonly"
            :model-value="fotoFile"
            accept="image/*"
            label="Foto"
            description="JPG, PNG"
            icon="i-heroicons-camera"
            class="w-full"
            :ui="{
              root: 'w-full',
              base: `w-full ${FOTO_MAX_HEIGHT} min-h-44 items-center justify-center`,
              wrapper: 'flex flex-col items-center justify-center text-center'
            }"
            @update:model-value="onFotoChange"
          />
          <div
            v-else
            class="w-full min-h-44 max-h-64 flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400"
          >
            Sin foto
          </div>
          <ImageModal
            :is-open="previewOpen"
            :image-url="localItem.foto_url"
            alt-text="Producto"
            @close="previewOpen = false"
          />
        </div>

        <div class="min-w-0 self-start grid grid-cols-2 gap-x-3 gap-y-3 content-start">
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
              class="w-full"
              :disabled="readonly"
              :model-value="precioDisplay"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              @focus="onPrecioFocus"
              @blur="onPrecioBlur"
              @update:model-value="onPrecioInput"
            >
              <template #leading>
                <span class="text-gray-500">$</span>
              </template>
            </UInput>
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

    <section v-if="visibleLabels.length" class="px-4 pb-4">
      <FormSection
        title="Características"
        :badge="caracteristicasBadge"
        :badge-color="caracteristicasBadgeColor"
        icon="i-heroicons-adjustments-horizontal"
        collapsible
        :default-open="true"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <UFormField
            v-for="label in visibleLabels"
            :key="label"
            :label="getCaracteristicaFieldConfig(label).displayLabel"
            :required="!isOptionalCaracteristica(label)"
            class="w-full min-w-0"
          >
            <div
              v-if="getCaracteristicaFieldConfig(label).kind === 'value_with_unit'"
              class="flex gap-2 items-stretch"
            >
              <UInput
                class="min-w-0 flex-1"
                :disabled="readonly"
                :model-value="item.caracteristicas[label] || ''"
                placeholder="—"
                size="sm"
                @update:model-value="updateCaracteristica(label, $event)"
              />
              <USelect
                class="w-[7.5rem] shrink-0"
                :disabled="readonly"
                :model-value="item.caracteristicas[getCaracteristicaFieldConfig(label).unitKey!] || undefined"
                :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
                placeholder="Medida"
                size="sm"
                @update:model-value="updateCaracteristica(getCaracteristicaFieldConfig(label).unitKey!, String($event ?? ''))"
              />
            </div>
            <USelect
              v-else-if="getCaracteristicaFieldConfig(label).kind === 'select'"
              class="w-full"
              :disabled="readonly"
              :model-value="item.caracteristicas[label] || undefined"
              :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
              placeholder="Seleccionar"
              size="sm"
              @update:model-value="updateCaracteristica(label, String($event ?? ''))"
            />
            <UInput
              v-else
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
