import { isOptionalCaracteristica } from '~/utils/marcaModelo'
import { getRequiredCaracteristicaValues } from '~/utils/caracteristicaFields'

export function getItemProgress(
  item: {
    nombre_comercial: string
    foto_url: string
    qty: number | null
    precio_unitario: number | null
    hs_code: string
    link_producto: string
    caracteristicas: Record<string, string>
  },
  labels: string[]
) {
  const values = [
    item.nombre_comercial,
    item.foto_url,
    item.qty,
    item.precio_unitario,
    item.hs_code,
    item.link_producto,
    ...getRequiredCaracteristicaValues(labels, item.caracteristicas, isOptionalCaracteristica)
  ]

  const filled = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length
  const total = values.length

  return {
    filled,
    total,
    percent: total ? Math.round((filled / total) * 100) : 0
  }
}

export function formatUsd(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Limpia texto de dinero dejando solo dígitos y hasta 2 decimales. */
export function sanitizeMoneyDraft(raw: string | number | null | undefined): string {
  let cleaned = String(raw ?? '').replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned

  cleaned =
    cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  const [intPart, decPart = ''] = cleaned.split('.')
  return `${intPart}.${decPart.slice(0, 2)}`
}

/** Formatea con miles mientras se escribe (ej. 1234.5 → 1,234.5). */
export function formatMoneyWhileTyping(raw: string | number | null | undefined): string {
  const cleaned = sanitizeMoneyDraft(raw)
  if (!cleaned) return ''
  if (cleaned === '.') return '0.'

  const [intRaw, decRaw] = cleaned.split('.')
  const intNum = Number(intRaw || '0')
  if (!Number.isFinite(intNum)) return ''

  const intFormatted = intNum.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (decRaw !== undefined) return `${intFormatted}.${decRaw}`
  return intFormatted
}

export function parseMoneyDraft(raw: string | number | null | undefined): number | null {
  const cleaned = sanitizeMoneyDraft(raw)
  if (!cleaned || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calcItemTotal(item: { qty: number | null; precio_unitario: number | null }) {
  const qty = Number(item.qty || 0)
  const price = Number(item.precio_unitario || 0)
  return qty && price ? qty * price : 0
}
