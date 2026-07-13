import type { ItemFormState, ProveedorFormState } from '~/types/excelConfirmacion'

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
  field: ItemRequiredFieldKey
  label: string
}

export type ProveedorCompletionStatus = 'empty' | 'partial' | 'complete'

export function getItemRequiredErrors(item: ItemFormState): FormValidationError[] {
  return (Object.entries(ITEM_REQUIRED_FIELDS) as [ItemRequiredFieldKey, RequiredFieldConfig][])
    .filter(([, config]) => !config.isValid(item))
    .map(([field, config]) => ({
      proveedorCode: '',
      itemName: item.nombre_comercial || item.initial_name || 'Producto',
      field,
      label: config.label
    }))
}

export function isItemComplete(item: ItemFormState): boolean {
  return getItemRequiredErrors(item).length === 0
}

export function getProveedorCompletionStatus(proveedor: ProveedorFormState): ProveedorCompletionStatus {
  if (!proveedor.items.length) return 'empty'
  return proveedor.items.every(isItemComplete) ? 'complete' : 'partial'
}

export function validateFormState(proveedores: ProveedorFormState[]): FormValidationError[] {
  const errors: FormValidationError[] = []

  for (const proveedor of proveedores) {
    for (const item of proveedor.items) {
      for (const error of getItemRequiredErrors(item)) {
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
