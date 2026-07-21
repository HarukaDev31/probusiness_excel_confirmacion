import type { ItemFormState, ProveedorFormState } from '~/types/excelConfirmacion'
import { isProveedorFormLocked } from '~/utils/proveedorLock'

export const SM_DEFAULT = 'S/M'

export function normalizeCaracteristicaLabel(label: string): string {
  return label.replace(/:$/g, '').trim().toLowerCase()
}

/** Marca y Modelo no son obligatorios; si faltan al guardar se proponen como S/M. */
export function isOptionalCaracteristica(label: string): boolean {
  const key = normalizeCaracteristicaLabel(label)
  return key === 'marca' || key === 'modelo'
}

export function getRequiredCaracteristicaLabels(labels: string[]): string[] {
  return labels.filter((label) => !isOptionalCaracteristica(label))
}

export interface MissingMarcaModeloItem {
  proveedorCode: string
  itemId: number
  itemName: string
  missing: Array<'Marca' | 'Modelo'>
}

export function findMissingMarcaModelo(
  proveedores: ProveedorFormState[],
  labelsForTipo: (tipo: string) => string[]
): MissingMarcaModeloItem[] {
  const result: MissingMarcaModeloItem[] = []

  for (const proveedor of proveedores) {
    if (isProveedorFormLocked(proveedor)) continue

    for (const item of proveedor.items) {
      const labels = labelsForTipo(item.tipo_producto)
      const missing: Array<'Marca' | 'Modelo'> = []

      for (const label of labels) {
        const key = normalizeCaracteristicaLabel(label)
        if (key !== 'marca' && key !== 'modelo') continue
        const value = String(item.caracteristicas[label] ?? '').trim()
        if (value === '') {
          missing.push(key === 'marca' ? 'Marca' : 'Modelo')
        }
      }

      if (missing.length) {
        result.push({
          proveedorCode: proveedor.code_supplier || 'Proveedor',
          itemId: item.id,
          itemName: item.nombre_comercial || item.initial_name || 'Producto',
          missing
        })
      }
    }
  }

  return result
}

export function formatMissingMarcaModeloMessage(items: MissingMarcaModeloItem[]): string {
  if (!items.length) return ''

  const lines = items.map((item) => {
    const campos = item.missing.join(' y ')
    return `• ${item.proveedorCode} · ${item.itemName}: ${campos}`
  })

  return [
    'Los siguientes productos no tienen Marca y/o Modelo. Al continuar se llenarán con «S/M»:',
    '',
    ...lines
  ].join('\n')
}

/** Rellena Marca/Modelo vacíos con S/M sobre el formState (mutación inmutable). */
export function applySmDefaultsToFormState(
  proveedores: ProveedorFormState[],
  labelsForTipo: (tipo: string) => string[]
): ProveedorFormState[] {
  return proveedores.map((proveedor) => {
    if (isProveedorFormLocked(proveedor)) return proveedor

    return {
      ...proveedor,
      items: proveedor.items.map((item) => {
        const labels = labelsForTipo(item.tipo_producto)
        let changed = false
        const caracteristicas = { ...item.caracteristicas }

        for (const label of labels) {
          if (!isOptionalCaracteristica(label)) continue
          if (String(caracteristicas[label] ?? '').trim() !== '') continue
          caracteristicas[label] = SM_DEFAULT
          changed = true
        }

        return changed ? { ...item, caracteristicas } : item
      })
    }
  })
}
