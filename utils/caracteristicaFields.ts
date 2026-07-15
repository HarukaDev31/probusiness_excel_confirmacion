export const UNIDAD_TAMANO_KEY = 'Unidad Tamaño:'
export const UNIDAD_CAPACIDAD_KEY = 'Unidad Capacidad:'
export const UNIDAD_PESO_NETO_KEY = 'Unidad Peso Neto:'

export const UNIDADES_TAMANO = ['mm', 'cm', 'metros', 'pulgadas'] as const
export const UNIDADES_CAPACIDAD = ['ml', 'kg'] as const
export const UNIDADES_PESO_NETO = ['gr', 'kg', 'tn'] as const
export const UNIDADES_MEDIDA = ['pares', 'piezas', 'sets', 'kits', 'rollos', 'kg'] as const

export type CaracteristicaFieldKind = 'text' | 'select' | 'value_with_unit'

export interface CaracteristicaFieldConfig {
  kind: CaracteristicaFieldKind
  displayLabel: string
  unitKey?: string
  options?: readonly string[]
}

export function normalizeCaracteristicaKey(label: string): string {
  return label.replace(/:$/g, '').trim().toLowerCase()
}

export function isCompanionUnitLabel(label: string): boolean {
  const key = normalizeCaracteristicaKey(label)
  return key === 'unidad tamaño' || key === 'unidad capacidad' || key === 'unidad peso neto'
}

export function getCaracteristicaFieldConfig(label: string): CaracteristicaFieldConfig {
  const key = normalizeCaracteristicaKey(label)

  if (
    key === 'tamaño (producto)' ||
    key === 'tamaño' ||
    key === 'tamaño del producto' ||
    key === 'tamaño (metros)'
  ) {
    return {
      kind: 'value_with_unit',
      displayLabel: 'Tamaño (Producto)',
      unitKey: UNIDAD_TAMANO_KEY,
      options: UNIDADES_TAMANO
    }
  }

  if (key === 'capacidad' || key === 'capacidad (ml o kg)') {
    return {
      kind: 'value_with_unit',
      displayLabel: 'Capacidad',
      unitKey: UNIDAD_CAPACIDAD_KEY,
      options: UNIDADES_CAPACIDAD
    }
  }

  if (key === 'peso neto (producto)' || key === 'peso neto' || key === 'peso') {
    return {
      kind: 'value_with_unit',
      displayLabel: 'Peso Neto (Producto)',
      unitKey: UNIDAD_PESO_NETO_KEY,
      options: UNIDADES_PESO_NETO
    }
  }

  if (key === 'unidad de medida' || key === 'pares o piezas') {
    return {
      kind: 'select',
      displayLabel: 'Unidad de medida',
      options: UNIDADES_MEDIDA
    }
  }

  return {
    kind: 'text',
    displayLabel: label.replace(/:$/, '').trim()
  }
}

/** Claves de unidad asociadas a los labels visibles del tipo. */
export function unitKeysForLabels(labels: string[]): string[] {
  const keys = new Set<string>()
  for (const label of labels) {
    if (isCompanionUnitLabel(label)) continue
    const unitKey = getCaracteristicaFieldConfig(label).unitKey
    if (unitKey) keys.add(unitKey)
  }
  return [...keys]
}

/** Labels a mostrar (excluye companions ocultos). */
export function visibleCaracteristicaLabels(labels: string[]): string[] {
  return labels.filter((label) => !isCompanionUnitLabel(label))
}

/**
 * Valores requeridos de características: labels visibles (sin marca/modelo)
 * más las unidades asociadas.
 */
export function getRequiredCaracteristicaValues(
  labels: string[],
  caracteristicas: Record<string, string>,
  isOptional: (label: string) => boolean
): Array<string | null | undefined> {
  const values: Array<string | null | undefined> = []

  for (const label of visibleCaracteristicaLabels(labels)) {
    if (isOptional(label)) continue
    values.push(caracteristicas[label])
    const unitKey = getCaracteristicaFieldConfig(label).unitKey
    if (unitKey) values.push(caracteristicas[unitKey])
  }

  return values
}

export function selectOptions(options: readonly string[]) {
  return options.map((value) => ({ label: value, value }))
}
