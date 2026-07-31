/** Solo «Incluye» es opcional; el resto de características son obligatorias. */
export function normalizeCaracteristicaLabel(label: string): string {
  return label.replace(/:$/g, '').trim().toLowerCase()
}

export function isOptionalCaracteristica(label: string): boolean {
  return normalizeCaracteristicaLabel(label) === 'incluye'
}

export function getRequiredCaracteristicaLabels(labels: string[]): string[] {
  return labels.filter((label) => !isOptionalCaracteristica(label))
}
