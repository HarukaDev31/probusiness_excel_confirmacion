import type { ItemFormState, ProveedorFormState } from '~/types/excelConfirmacion'
import {
  getCaracteristicaFieldConfig,
  visibleCaracteristicaLabels
} from '~/utils/caracteristicaFields'
import { isOptionalCaracteristica } from '~/utils/marcaModelo'

type RequiredFieldConfig = {
  label: string
  isValid: (item: ItemFormState) => boolean
}

/** Mapa único de campos obligatorios. Agregar aquí para extender validación y UI. */
export const ITEM_REQUIRED_FIELDS = {
  nombre_comercial: {
    label: 'Nombre comercial',
    isValid: (item) => String(item.nombre_comercial ?? '').trim().length > 0
  },
  qty: {
    label: 'Cantidad',
    isValid: (item) => {
      const value = Number(item.qty)
      return Number.isFinite(value) && value > 0
    }
  },
  precio_unitario: {
    label: 'Precio EXW',
    isValid: (item) => {
      const value = Number(item.precio_unitario)
      return Number.isFinite(value) && value > 0
    }
  }
} as const satisfies Record<string, RequiredFieldConfig>

export type ItemRequiredFieldKey = keyof typeof ITEM_REQUIRED_FIELDS

export interface FormValidationError {
  proveedorCode: string
  itemName: string
  field: ItemRequiredFieldKey | string
  label: string
}

export type ProveedorCompletionStatus = 'empty' | 'partial' | 'complete'

export function getItemRequiredErrors(
  item: ItemFormState,
  labels: string[] = []
): FormValidationError[] {
  const itemName = item.nombre_comercial || item.initial_name || 'Producto'
  const errors: FormValidationError[] = (
    Object.entries(ITEM_REQUIRED_FIELDS) as [ItemRequiredFieldKey, RequiredFieldConfig][]
  )
    .filter(([, config]) => !config.isValid(item))
    .map(([field, config]) => ({
      proveedorCode: '',
      itemName,
      field,
      label: config.label
    }))

  for (const label of visibleCaracteristicaLabels(labels)) {
    if (isOptionalCaracteristica(label)) continue

    const displayLabel = getCaracteristicaFieldConfig(label).displayLabel
    if (String(item.caracteristicas[label] ?? '').trim() === '') {
      errors.push({
        proveedorCode: '',
        itemName,
        field: label,
        label: displayLabel
      })
    }

    const unitKey = getCaracteristicaFieldConfig(label).unitKey
    if (unitKey && String(item.caracteristicas[unitKey] ?? '').trim() === '') {
      errors.push({
        proveedorCode: '',
        itemName,
        field: unitKey,
        label: `Unidad de medida (${displayLabel})`
      })
    }
  }

  return errors
}

export function isItemComplete(item: ItemFormState, labels: string[] = []): boolean {
  return getItemRequiredErrors(item, labels).length === 0
}

export function getProveedorCompletionStatus(
  proveedor: ProveedorFormState,
  labelsForTipo: (tipo: string) => string[] = () => []
): ProveedorCompletionStatus {
  if (!proveedor.items.length) return 'empty'
  return proveedor.items.every((item) => isItemComplete(item, labelsForTipo(item.tipo_producto)))
    ? 'complete'
    : 'partial'
}

export function validateFormState(
  proveedores: ProveedorFormState[],
  labelsForTipo: (tipo: string) => string[] = () => []
): FormValidationError[] {
  const errors: FormValidationError[] = []

  for (const proveedor of proveedores) {
    for (const item of proveedor.items) {
      for (const error of getItemRequiredErrors(item, labelsForTipo(item.tipo_producto))) {
        errors.push({
          ...error,
          proveedorCode: proveedor.code_supplier || 'Proveedor'
        })
      }
    }
  }

  return errors
}

export function formatValidationMessage(errors: FormValidationError[]): string {
  if (!errors.length) return ''

  const first = errors[0]
  const suffix = errors.length > 1 ? ` (+${errors.length - 1} campo${errors.length > 2 ? 's' : ''} más)` : ''
  return `${first.proveedorCode} · ${first.itemName}: falta ${first.label}${suffix}`
}
