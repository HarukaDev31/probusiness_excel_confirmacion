export type LabelsPorTipoProducto = Record<string, string[]>

/** Claves reservadas dentro de `caracteristicas` para campos fijos del formulario */
export const CAMPO_NOMBRE_COMERCIAL = 'NOMBRE COMERCIAL'
export const CAMPO_FOTO = 'FOTO/IMAGEN'
export const CAMPO_HS_CODE = 'HS CODE (Solicitar al Proveedor)'
export const CAMPO_LINK = 'LINK DEL PRODUCTO'

export const CAMPOS_FIJOS = [
  CAMPO_NOMBRE_COMERCIAL,
  CAMPO_FOTO,
  CAMPO_HS_CODE,
  CAMPO_LINK
] as const

export interface ExcelConfirmacionItem {
  id: number
  initial_name: string
  tipo_producto: string
  initial_qty: number | null
  initial_price: number | null
  caracteristicas: Record<string, string>
  qty: number | null
  precio_unitario: number | null
  is_new?: boolean
}

export interface ExcelConfirmacionProveedor {
  id: number
  code_supplier: string
  supplier: string | null
  excel_conf_status: string | null
  excel_conf_form_cerrado?: boolean
  items: ExcelConfirmacionItem[]
}

export interface ExcelConfirmacionData {
  uuid: string
  id: number
  carga: string
  nombre_cliente: string
  proveedores: ExcelConfirmacionProveedor[]
}

export interface ExcelConfirmacionSavePayload {
  proveedores: Array<{
    id: number
    items: Array<{
      id: number
      is_new?: boolean
      tipo_producto?: string
      caracteristicas: Record<string, string>
      qty: number | null
      precio_unitario: number | null
    }>
  }>
}

export interface ApiResponse<T> {
  success: boolean
  code?: string
  title?: string
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export interface ItemFormState {
  id: number
  initial_name: string
  tipo_producto: string
  caracteristicas: Record<string, string>
  qty: number | null
  precio_unitario: number | null
  nombre_comercial: string
  /** URL pública (API) o blob: local para preview */
  foto_url: string
  /** Archivo pendiente de subir (multipart). No se serializa en draft. */
  foto_file?: File | null
  hs_code: string
  link_producto: string
  isNew?: boolean
}

export interface ProveedorFormState {
  id: number
  code_supplier: string
  excel_conf_status?: string | null
  excel_conf_form_cerrado?: boolean
  items: ItemFormState[]
}
