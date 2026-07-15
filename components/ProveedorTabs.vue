<script setup lang="ts">
import type { ItemFormState, ProveedorFormState } from '~/types/excelConfirmacion'
import { getProveedorCompletionStatus, type ProveedorCompletionStatus } from '~/utils/formValidation'
import { getItemProgress } from '~/utils/itemForm'

const props = defineProps<{
  proveedores: ProveedorFormState[]
  labelsForTipo: (tipo: string) => string[]
}>()

const activeIndex = defineModel<number>('activeIndex', { default: 0 })
const openProductIds = defineModel<string[]>('openProductIds', { default: () => [] })

const emit = defineEmits<{
  'update:proveedores': [ProveedorFormState[]]
  'remove-product': [itemId: number]
  'add-product': []
}>()

const productKey = (item: ItemFormState) => String(item.id)

const tabs = computed(() =>
  props.proveedores.map((p, index) => ({
    label: p.code_supplier || `Proveedor ${index + 1}`,
    value: index,
    badge: String(p.items.length),
    status: getProveedorCompletionStatus(p)
  }))
)

const proveedorStatusDotClass = (status: ProveedorCompletionStatus) => {
  if (status === 'complete') return 'bg-success-500 shadow-[0_0_0_2px_rgba(34,197,94,0.25)]'
  if (status === 'partial') return 'bg-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.25)]'
  return 'bg-gray-300'
}

const activeProveedor = computed(() => props.proveedores[activeIndex.value])
const activeProveedorCerrado = computed(() => Boolean(activeProveedor.value?.excel_conf_form_cerrado))

const proveedorProgress = computed(() => {
  const proveedor = activeProveedor.value
  if (!proveedor?.items.length) return { filled: 0, total: 0, percent: 0 }

  let filled = 0
  let total = 0
  for (const item of proveedor.items) {
    const labels = props.labelsForTipo(item.tipo_producto)
    const p = getItemProgress(item, labels)
    filled += p.filled
    total += p.total
  }
  return { filled, total, percent: total ? Math.round((filled / total) * 100) : 0 }
})

const progressColor = (percent: number) => {
  if (percent === 100) return 'success'
  if (percent >= 50) return 'primary'
  return 'warning'
}

const progressPillClass = (percent: number) => {
  if (percent === 100) return 'bg-success-50 text-success-700'
  return 'bg-amber-50 text-amber-700'
}

const progressStatusLabel = (percent: number) =>
  percent === 100 ? 'Listo' : 'Pendiente'

const openProductId = computed({
  get: () => openProductIds.value[0] ?? undefined,
  set: (value: string | undefined | null) => {
    openProductIds.value = value ? [String(value)] : []
  }
})

const accordionItems = computed(() => {
  const proveedor = activeProveedor.value
  if (!proveedor) return []

  return proveedor.items.map((item, index) => {
    const labels = props.labelsForTipo(item.tipo_producto)
    const progress = getItemProgress(item, labels)
    return {
      value: productKey(item),
      label: item.initial_name || `Producto ${index + 1}`,
      item,
      index,
      labels,
      progress
    }
  })
})

const completedProducts = computed(() =>
  accordionItems.value.filter((item) => item.progress.percent === 100).length
)

const updateItem = (proveedorIndex: number, itemIndex: number, item: ItemFormState) => {
  const next = props.proveedores.map((proveedor, pIdx) => {
    if (pIdx !== proveedorIndex) return proveedor
    const items = proveedor.items.map((current, iIdx) => (iIdx === itemIndex ? item : current))
    return { ...proveedor, items }
  })
  emit('update:proveedores', next)
}

watch(activeIndex, () => {
  const proveedor = props.proveedores[activeIndex.value]
  if (!proveedor?.items.length) {
    openProductIds.value = []
    return
  }
  openProductIds.value = [productKey(proveedor.items[0])]
})

watch(
  () => props.proveedores[activeIndex.value]?.items,
  (items) => {
    if (items?.length && !openProductIds.value.length) {
      openProductIds.value = [productKey(items[0])]
    }
  },
  { immediate: true }
)

watch(
  () => props.proveedores[activeIndex.value]?.items.length,
  (length, prev) => {
    if (length && prev !== undefined && length > prev) {
      const proveedor = props.proveedores[activeIndex.value]
      const last = proveedor?.items[proveedor.items.length - 1]
      if (last) {
        openProductIds.value = [productKey(last)]
      }
    }
  }
)
</script>

<template>
  <div>
    <!-- Tabs proveedor fijos -->
    <div class="sticky top-11 z-10 -mx-4 px-4 py-2 bg-gray-100/95 backdrop-blur-sm border-b border-gray-200 mb-3">
      <div class="rounded-lg border border-gray-200 bg-white p-1.5">
        <UTabs
          v-model="activeIndex"
          :items="tabs"
          variant="pill"
          color="primary"
          class="w-full"
          :content="false"
        >
          <template #leading="{ item }">
            <span
              class="size-2 rounded-full shrink-0"
              :class="proveedorStatusDotClass(item.status)"
            />
            <UIcon
              v-if="proveedores[item.value]?.excel_conf_form_cerrado"
              name="i-heroicons-lock-closed"
              class="size-3.5 text-amber-600 shrink-0"
            />
          </template>
        </UTabs>
      </div>
    </div>

    <!-- Aviso formulario cerrado -->
    <UAlert
      v-if="activeProveedorCerrado"
      icon="i-heroicons-lock-closed"
      color="warning"
      variant="soft"
      title="Formulario cerrado"
      description="Coordinación cerró este proveedor. Ya no puedes editar ni guardar cambios."
      class="mb-3"
    />

    <!-- Progreso general del proveedor -->
    <div
      v-if="activeProveedor?.items.length"
      class="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
    >
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-medium text-gray-600">Progreso general</span>
        <span class="text-xs text-gray-500 tabular-nums">
          {{ completedProducts }}/{{ accordionItems.length }} listos
        </span>
      </div>

      <div class="flex items-center gap-2">
        <UProgress
          :model-value="proveedorProgress.percent"
          :color="progressColor(proveedorProgress.percent)"
          size="sm"
          class="flex-1"
        />
        <span class="text-xs font-semibold text-gray-700 tabular-nums shrink-0 w-9 text-right">
          {{ proveedorProgress.percent }}%
        </span>
      </div>
    </div>

    <!-- Lista de productos -->
    <div v-for="(proveedor, proveedorIndex) in proveedores" :key="proveedor.id">
      <div v-show="proveedorIndex === activeIndex">
        <UAccordion
          v-if="proveedor.items.length"
          v-model="openProductId"
          type="single"
          collapsible
          :items="accordionItems"
          :unmount-on-hide="false"
          :ui="{
            item: 'mb-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm',
            trigger: 'px-3 py-2.5 hover:bg-gray-50/80 gap-2.5',
            label: 'flex-1 min-w-0'
          }"
        >
          <template #default="{ item: accItem }">
            <div class="flex items-center gap-2.5 w-full min-w-0">
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
              >
                {{ accItem.index + 1 }}
              </span>

              <p class="font-medium text-gray-900 truncate text-sm min-w-0">
                {{ accItem.label }}
                <UBadge v-if="accItem.item.isNew" color="success" variant="subtle" size="xs" class="ml-1">Nuevo</UBadge>
              </p>
            </div>
          </template>

          <template #trailing="{ item: accItem, open }">
            <div class="flex items-center gap-1.5 shrink-0 ms-auto">
              <span
                class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                :class="progressPillClass(accItem.progress.percent)"
              >
                {{ progressStatusLabel(accItem.progress.percent) }}
              </span>
              <UBadge color="primary" variant="soft" size="xs" class="shrink-0">
                {{ accItem.item.tipo_producto }}
              </UBadge>
              <UIcon
                name="i-heroicons-chevron-down"
                class="size-4 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </div>
          </template>

          <template #content="{ item: accItem, index }">
            <ItemConfirmacionForm
              :item="accItem.item"
              :labels="accItem.labels"
              :readonly="Boolean(proveedor.excel_conf_form_cerrado)"
              @update:item="updateItem(proveedorIndex, index, $event)"
              @remove="emit('remove-product', accItem.item.id)"
            />
          </template>
        </UAccordion>

        <div
          v-else
          class="rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center"
        >
          <UIcon name="i-heroicons-cube-transparent" class="size-10 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-600 font-medium mb-1">Sin productos</p>
          <UButton color="primary" variant="soft" icon="i-heroicons-plus" class="mt-3" @click="emit('add-product')">
            Agregar producto
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
