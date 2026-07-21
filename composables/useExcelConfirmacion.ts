import { useDebounceFn } from '@vueuse/core'
import { ExcelConfirmacionService } from '~/services/excelConfirmacionService'
import { clearFormDraft, loadFormDraft, saveFormDraft } from '~/utils/formDraftStorage'
import { formatValidationMessage, validateFormState } from '~/utils/formValidation'
import {
  ClientApiError,
  clientMessageFromCode,
  type ClientMessage
} from '~/utils/clientApiError'
import {
  CAMPO_FOTO,
  CAMPO_HS_CODE,
  CAMPO_LINK,
  CAMPO_NOMBRE_COMERCIAL,
  CAMPOS_FIJOS,
  type ExcelConfirmacionData,
  type ItemFormState,
  type LabelsPorTipoProducto,
  type ProveedorFormState
} from '~/types/excelConfirmacion'
import { unitKeysForLabels } from '~/utils/caracteristicaFields'
import { isProveedorFormLocked } from '~/utils/proveedorLock'

const normalizeLabel = (label: string) => label.trim().toLowerCase()

const isCampoFijo = (label: string) =>
  CAMPOS_FIJOS.some((campo) => normalizeLabel(campo) === normalizeLabel(label))

let tempIdCounter = -1

const buildCaracteristicasForTipo = (
  tipo: string,
  labels: LabelsPorTipoProducto
): Record<string, string> => {
  const key = (tipo || 'GENERAL').toUpperCase()
  const tipoLabels = (labels[key] || labels.GENERAL || []).filter((label) => !isCampoFijo(label))
  const unitKeys = unitKeysForLabels(tipoLabels)
  return Object.fromEntries([...tipoLabels, ...unitKeys].map((label) => [label, '']))
}

const LEGACY_CARACTERISTICA_ALIASES: Record<string, string[]> = {
  'Tamaño (Producto):': ['Tamaño:', 'Tamaño del producto:', 'Tamaño (Metros):'],
  'Capacidad:': ['Capacidad (ml o kg):'],
  'Peso Neto (Producto):': ['Peso Neto:', 'Peso'],
  'Unidad de medida:': ['Pares o Piezas:']
}

const resolveCaracteristicaFromRaw = (
  raw: Record<string, string>,
  label: string
): string => {
  const direct = String(raw[label] ?? '').trim()
  if (direct) return direct

  for (const alias of LEGACY_CARACTERISTICA_ALIASES[label] || []) {
    const value = String(raw[alias] ?? '').trim()
    if (value) return value
  }

  return String(raw[label] ?? '')
}

const extractItemFormState = (
  item: ExcelConfirmacionData['proveedores'][number]['items'][number],
  labels: LabelsPorTipoProducto
): ItemFormState => {
  const caracteristicas = { ...(item.caracteristicas || {}) }
  const tipoKey = (item.tipo_producto || 'GENERAL').toUpperCase()
  const tipoLabels = (labels[tipoKey] || labels.GENERAL || []).filter((label) => !isCampoFijo(label))
  const unitKeys = unitKeysForLabels(tipoLabels)

  const dynamicCaracteristicas: Record<string, string> = {}

  for (const label of tipoLabels) {
    dynamicCaracteristicas[label] = resolveCaracteristicaFromRaw(caracteristicas, label)
  }

  for (const unitKey of unitKeys) {
    dynamicCaracteristicas[unitKey] = String(caracteristicas[unitKey] ?? '')
  }

  // Conservar extras (p.ej. unidades) por si el tipo aún no lista todas
  for (const [key, value] of Object.entries(caracteristicas)) {
    if (isCampoFijo(key) || key in dynamicCaracteristicas) continue
    dynamicCaracteristicas[key] = value
  }

  if (
    String(caracteristicas['Tamaño (Metros):'] ?? '').trim() !== '' &&
    !String(dynamicCaracteristicas['Unidad Tamaño:'] ?? '').trim()
  ) {
    dynamicCaracteristicas['Unidad Tamaño:'] = 'metros'
  }

  return {
    id: item.id,
    initial_name: item.initial_name || '',
    tipo_producto: item.tipo_producto || 'GENERAL',
    caracteristicas: dynamicCaracteristicas,
    qty: item.qty ?? null,
    precio_unitario: item.precio_unitario ?? null,
    nombre_comercial: caracteristicas[CAMPO_NOMBRE_COMERCIAL] || '',
    foto_url: caracteristicas[CAMPO_FOTO] || '',
    hs_code: caracteristicas[CAMPO_HS_CODE] || '',
    link_producto: caracteristicas[CAMPO_LINK] || '',
    isNew: Boolean(item.is_new),
  }
}

const mergeItemForSave = (item: ItemFormState) => ({
  id: item.id,
  is_new: Boolean(item.isNew),
  tipo_producto: item.tipo_producto,
  caracteristicas: {
    ...item.caracteristicas,
    [CAMPO_NOMBRE_COMERCIAL]: item.nombre_comercial,
    [CAMPO_FOTO]: item.foto_url,
    [CAMPO_HS_CODE]: item.hs_code,
    [CAMPO_LINK]: item.link_producto
  },
  qty: item.qty,
  precio_unitario: item.precio_unitario
})

export function useExcelConfirmacion() {
  const loading = ref(false)
  const saving = ref(false)
  const clientMessage = ref<ClientMessage | null>(null)
  const successMessage = ref<string | null>(null)
  const data = ref<ExcelConfirmacionData | null>(null)
  const labels = ref<LabelsPorTipoProducto>({})
  const formState = ref<ProveedorFormState[]>([])
  const activeUuid = ref<string | null>(null)
  const isHydrating = ref(false)
  const hasDraft = ref(false)

  const persistDraft = useDebounceFn(async (uuid: string, state: ProveedorFormState[]) => {
    await saveFormDraft(uuid, state, tempIdCounter)
    hasDraft.value = true
  }, 600)

  watch(
    formState,
    (state) => {
      if (!activeUuid.value || loading.value || isHydrating.value) return
      persistDraft(activeUuid.value, state)
    },
    { deep: true }
  )

  const tiposDisponibles = computed(() =>
    Object.keys(labels.value).sort((a, b) => {
      if (a === 'GENERAL') return -1
      if (b === 'GENERAL') return 1
      return a.localeCompare(b, 'es')
    })
  )

  const buildFormState = (payload: ExcelConfirmacionData) => {
    formState.value = payload.proveedores.map((proveedor) => ({
      id: proveedor.id,
      code_supplier: proveedor.code_supplier,
      excel_conf_status: proveedor.excel_conf_status || null,
      excel_conf_form_cerrado: isProveedorFormLocked(proveedor),
      items: proveedor.items.map((item) => extractItemFormState(item, labels.value))
    }))
  }

  const isProveedorCerrado = (proveedorIndex: number) =>
    isProveedorFormLocked(formState.value[proveedorIndex])

  const proveedoresAbiertos = computed(() =>
    formState.value.filter((proveedor) => !isProveedorFormLocked(proveedor))
  )

  const allProveedoresCerrados = computed(() =>
    formState.value.length > 0 && proveedoresAbiertos.value.length === 0
  )

  const setClientMessage = (message: ClientMessage | null) => {
    clientMessage.value = message
  }

  const resolveErrorMessage = (err: unknown): ClientMessage => {
    if (err instanceof ClientApiError) {
      return {
        title: err.title,
        description: err.description,
        code: err.code,
        tone: err.tone
      }
    }
    return clientMessageFromCode('ERROR_INTERNO')
  }

  const load = async (uuid: string, options?: { skipDraft?: boolean }) => {
    loading.value = true
    clientMessage.value = null
    successMessage.value = null
    activeUuid.value = uuid

    try {
      const [labelsRes, dataRes] = await Promise.all([
        ExcelConfirmacionService.getLabels(),
        ExcelConfirmacionService.getByUuid(uuid)
      ])

      if (!labelsRes.data) {
        throw new ClientApiError({ ...clientMessageFromCode('LABELS_NO_DISPONIBLES') })
      }

      if (!dataRes.data) {
        throw new ClientApiError({ ...clientMessageFromCode('COTIZACION_NOT_FOUND') })
      }

      labels.value = labelsRes.data
      data.value = dataRes.data

      isHydrating.value = true

      const draft = !options?.skipDraft ? await loadFormDraft(uuid) : null
      if (draft) {
        const lockedPorProveedor = new Map(
          dataRes.data.proveedores.map((p) => [
            p.id,
            {
              excel_conf_status: p.excel_conf_status || null,
              excel_conf_form_cerrado: isProveedorFormLocked(p)
            }
          ])
        )
        formState.value = draft.formState.map((proveedor) => {
          const locked = lockedPorProveedor.get(proveedor.id)
          return {
            ...proveedor,
            excel_conf_status: locked?.excel_conf_status ?? proveedor.excel_conf_status ?? null,
            excel_conf_form_cerrado: locked?.excel_conf_form_cerrado ?? isProveedorFormLocked(proveedor)
          }
        })
        tempIdCounter = draft.tempIdCounter
        hasDraft.value = true
      } else {
        buildFormState(dataRes.data)
        hasDraft.value = false
      }
    } catch (err: unknown) {
      clientMessage.value = resolveErrorMessage(err)
      data.value = null
      formState.value = []
      hasDraft.value = false
    } finally {
      isHydrating.value = false
      loading.value = false
    }
  }

  const labelsForTipo = (tipo: string): string[] => {
    const key = (tipo || 'GENERAL').toUpperCase()
    const tipoLabels = labels.value[key] || labels.value.GENERAL || []
    return tipoLabels.filter((label) => !isCampoFijo(label))
  }

  const createEmptyItem = (tipo: string): ItemFormState => ({
    id: tempIdCounter--,
    initial_name: '',
    tipo_producto: tipo.toUpperCase(),
    caracteristicas: buildCaracteristicasForTipo(tipo, labels.value),
    qty: null,
    precio_unitario: null,
    nombre_comercial: '',
    foto_url: '',
    hs_code: '',
    link_producto: '',
    isNew: true
  })

  const addProduct = (proveedorIndex: number, tipo: string): number => {
    if (isProveedorCerrado(proveedorIndex)) return 0
    const item = createEmptyItem(tipo)
    formState.value = formState.value.map((proveedor, index) =>
      index === proveedorIndex
        ? { ...proveedor, items: [...proveedor.items, item] }
        : proveedor
    )
    return item.id
  }

  const removeProduct = (proveedorIndex: number, itemId: number) => {
    if (isProveedorCerrado(proveedorIndex)) return
    formState.value = formState.value.map((proveedor, index) =>
      index === proveedorIndex
        ? { ...proveedor, items: proveedor.items.filter((item) => item.id !== itemId) }
        : proveedor
    )
  }

  const buildSavePayload = () => ({
    proveedores: formState.value
      .filter((proveedor) => !isProveedorFormLocked(proveedor))
      .map((proveedor) => ({
        id: proveedor.id,
        items: proveedor.items.map(mergeItemForSave)
      }))
  })

  const save = async (uuid: string) => {
    saving.value = true
    clientMessage.value = null
    successMessage.value = null

    const validationErrors = validateFormState(
      formState.value.filter((proveedor) => !isProveedorFormLocked(proveedor))
    )
    if (validationErrors.length) {
      clientMessage.value = clientMessageFromCode(
        'VALIDACION_LOCAL',
        formatValidationMessage(validationErrors)
      )
      saving.value = false
      return false
    }

    if (!buildSavePayload().proveedores.length) {
      clientMessage.value = clientMessageFromCode('FORMULARIO_CERRADO_LOCAL')
      saving.value = false
      return false
    }

    try {
      const response = await ExcelConfirmacionService.save(uuid, buildSavePayload())
      successMessage.value = response.message || 'Tu confirmación se guardó correctamente.'
      await clearFormDraft(uuid)
      hasDraft.value = false
      return true
    } catch (err: unknown) {
      clientMessage.value = resolveErrorMessage(err)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    loading,
    saving,
    clientMessage,
    setClientMessage,
    successMessage,
    data,
    labels,
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
  }
}
