import type { ProveedorFormState } from '~/types/excelConfirmacion'

/** Un proveedor en Revisado queda bloqueado para el cliente. */
export function isProveedorFormLocked(
  proveedor: Pick<ProveedorFormState, 'excel_conf_form_cerrado' | 'excel_conf_status'> | null | undefined
): boolean {
  if (!proveedor) return false
  if (Boolean(proveedor.excel_conf_form_cerrado)) return true
  return String(proveedor.excel_conf_status || '').trim().toLowerCase() === 'revisado'
}
