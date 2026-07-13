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
    ...labels.map((label) => item.caracteristicas[label])
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

export function calcItemTotal(item: { qty: number | null; precio_unitario: number | null }) {
  const qty = Number(item.qty || 0)
  const price = Number(item.precio_unitario || 0)
  return qty && price ? qty * price : 0
}
