<script setup lang="ts">
import type { ClientMessage } from '~/utils/clientApiError'
import {
  applySmDefaultsToFormState,
  findMissingMarcaModelo,
  formatMissingMarcaModeloMessage
} from '~/utils/marcaModelo'

const route = useRoute()
const uuid = computed(() => String(route.params.uuid || ''))
const toast = useToast()
const colorMode = useColorMode()

const {
  loading,
  saving,
  clientMessage,
  setClientMessage,
  successMessage,
  data,
  formState,
  hasDraft,
  isProveedorCerrado,
  allProveedoresCerrados,
  tiposDisponibles,
  load,
  save,
  addProduct,
  removeProduct,
  labelsForTipo
} = useExcelConfirmacion()

const activeTabIndex = ref(0)
const openProductIds = ref<string[]>([])
const showAddModal = ref(false)
const showClientMessageModal = ref(false)
const showSmConfirmModal = ref(false)
const smConfirmMessage = ref<ClientMessage | null>(null)

const activeProductCount = computed(() =>
  formState.value[activeTabIndex.value]?.items.length ?? 0
)

const activeProveedorCerrado = computed(() => isProveedorCerrado(activeTabIndex.value))

const resolveInitialTab = () => {
  const code = String(route.query.proveedor || '').trim()
  if (!code || !formState.value.length) return
  const index = formState.value.findIndex(
    (p) => String(p.code_supplier || '').toLowerCase() === code.toLowerCase()
  )
  if (index >= 0) activeTabIndex.value = index
}

watch(clientMessage, (message) => {
  showClientMessageModal.value = Boolean(message)
})

watch(showClientMessageModal, (open) => {
  if (!open) setClientMessage(null)
})

watch(showSmConfirmModal, (open) => {
  if (!open) smConfirmMessage.value = null
})

const navigateAfterSave = async () => {
  const proveedor = formState.value[activeTabIndex.value]?.code_supplier
  await navigateTo({
    path: `/${uuid.value}/guardado`,
    query: {
      ...(data.value?.carga ? { carga: data.value.carga } : {}),
      ...(data.value?.nombre_cliente ? { cliente: data.value.nombre_cliente } : {}),
      ...(proveedor ? { proveedor } : {}),
      ...(successMessage.value ? { mensaje: successMessage.value } : {})
    }
  })
}

const performSave = async () => {
  const ok = await save(uuid.value)
  if (!ok) return
  await navigateAfterSave()
}

const handleSave = async () => {
  const abiertos = formState.value.filter((proveedor) => !proveedor.excel_conf_form_cerrado)
  const missing = findMissingMarcaModelo(abiertos, labelsForTipo)

  if (missing.length) {
    smConfirmMessage.value = {
      title: 'Marca / Modelo incompletos',
      description: formatMissingMarcaModeloMessage(missing),
      code: 'MARCA_MODELO_SM',
      tone: 'warning'
    }
    showSmConfirmModal.value = true
    return
  }

  await performSave()
}

const confirmSmAndSave = async () => {
  formState.value = applySmDefaultsToFormState(formState.value, labelsForTipo)
  await performSave()
}

const handleAddProduct = (tipo: string) => {
  const newId = addProduct(activeTabIndex.value, tipo)
  openProductIds.value = [String(newId)]
  toast.add({ title: 'Producto agregado', description: tipo, color: 'success' })
}

const handleRemoveProduct = (itemId: number) => {
  removeProduct(activeTabIndex.value, itemId)
  openProductIds.value = openProductIds.value.filter((id) => id !== String(itemId))
}

onMounted(async () => {
  colorMode.preference = 'light'
  if (!uuid.value) {
    setClientMessage({
      title: 'Enlace inválido',
      description: 'El enlace que abriste no es válido. Solicita a coordinación un nuevo acceso al formulario.',
      code: 'ENLACE_INVALIDO',
      tone: 'error'
    })
    return
  }
  await load(uuid.value)
  if (hasDraft.value && data.value) {
    toast.add({
      title: 'Borrador restaurado',
      description: 'Se recuperó tu progreso guardado localmente.',
      color: 'info'
    })
  }
  resolveInitialTab()
})

watch(() => route.query.proveedor, () => resolveInitialTab())
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-28">
    <PageHeader :loading="loading" :carga="data?.carga" :nombre-cliente="data?.nombre_cliente" />

    <main class="max-w-6xl mx-auto px-4 py-4">
      <ConfirmacionSkeleton v-if="loading" />

      <ProveedorTabs
        v-else-if="data && formState.length"
        v-model:active-index="activeTabIndex"
        v-model:open-product-ids="openProductIds"
        :proveedores="formState"
        :labels-for-tipo="labelsForTipo"
        @update:proveedores="formState = $event"
        @remove-product="handleRemoveProduct"
        @add-product="showAddModal = true"
      />

      <div
        v-else-if="data && !formState.length"
        class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 text-sm mt-4"
      >
        No hay ítems para confirmar.
      </div>

      <div
        v-else-if="!data && !clientMessage"
        class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 text-sm mt-4"
      >
        Cotización no encontrada.
      </div>
    </main>

    <FixedActionBar
      v-if="data && formState.length"
      :saving="saving"
      :product-count="activeProductCount"
      :save-disabled="activeProveedorCerrado || allProveedoresCerrados"
      :add-disabled="activeProveedorCerrado"
      @save="handleSave"
      @add="showAddModal = true"
    />

    <AddProductModal
      v-model:open="showAddModal"
      :tipos="tiposDisponibles"
      :labels-for-tipo="labelsForTipo"
      @confirm="handleAddProduct"
    />

    <ClientMessageModal
      v-model:open="showClientMessageModal"
      :message="clientMessage"
    />

    <ClientMessageModal
      v-model:open="showSmConfirmModal"
      :message="smConfirmMessage"
      confirmable
      confirm-label="Continuar y guardar"
      cancel-label="Revisar"
      @confirm="confirmSmAndSave"
    />
  </div>
</template>
