import type {
  ApiResponse,
  ExcelConfirmacionData,
  ExcelConfirmacionSavePayload,
  LabelsPorTipoProducto
} from '~/types/excelConfirmacion'
import { ClientApiError, parseClientApiError } from '~/utils/clientApiError'

const BASE = 'api/contenedor/external/excel-confirmacion'

export class ExcelConfirmacionService {
  private static getBaseUrl(): string {
    const config = useRuntimeConfig()
    return String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  }

  private static async request<T>(endpoint: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return await $fetch<T>(`${this.getBaseUrl()}/${endpoint.replace(/^\//, '')}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      })
    } catch (error) {
      throw parseClientApiError(error)
    }
  }

  private static ensureSuccess<T>(response: ApiResponse<T>): ApiResponse<T> {
    if (!response?.success) {
      throw new ClientApiError({
        title: response.title || 'Algo salió mal',
        description: response.message || 'No pudimos completar la operación. Intenta nuevamente.',
        code: response.code,
        tone: 'error'
      })
    }
    return response
  }

  static async getLabels(): Promise<ApiResponse<LabelsPorTipoProducto>> {
    const response = await this.request<ApiResponse<LabelsPorTipoProducto>>(`${BASE}/labels`)
    return this.ensureSuccess(response)
  }

  static async getByUuid(uuid: string): Promise<ApiResponse<ExcelConfirmacionData>> {
    const response = await this.request<ApiResponse<ExcelConfirmacionData>>(`${BASE}/${uuid}`)
    return this.ensureSuccess(response)
  }

  static async save(uuid: string, payload: ExcelConfirmacionSavePayload): Promise<ApiResponse<null>> {
    const response = await this.request<ApiResponse<null>>(`${BASE}/${uuid}`, {
      method: 'PUT',
      body: payload
    })
    return this.ensureSuccess(response)
  }
}
