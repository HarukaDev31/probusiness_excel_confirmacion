export type ClientMessageTone = 'error' | 'warning' | 'info' | 'success'

export interface ClientMessage {
  title: string
  description: string
  code?: string
  tone?: ClientMessageTone
}

export interface ApiErrorBody {
  success?: boolean
  code?: string
  title?: string
  message?: string
  errors?: Record<string, string[]>
}

const FALLBACK_MESSAGES: Record<string, ClientMessage> = {
  COTIZACION_NOT_FOUND: {
    title: 'Enlace no disponible',
    description: 'No encontramos tu formulario de confirmación. Verifica el enlace o solicita uno nuevo a coordinación.',
    tone: 'error'
  },
  LABELS_NO_DISPONIBLES: {
    title: 'No pudimos cargar el formulario',
    description: 'Hubo un problema al preparar el formulario. Intenta recargar la página en unos minutos.',
    tone: 'error'
  },
  DATOS_NO_DISPONIBLES: {
    title: 'No pudimos cargar tu información',
    description: 'Ocurrió un inconveniente al obtener tus datos. Recarga la página o vuelve a abrir el enlace.',
    tone: 'error'
  },
  VALIDACION_DATOS: {
    title: 'Revisa los datos ingresados',
    description: 'Algunos campos no son válidos o están incompletos. Corrígelos e intenta guardar nuevamente.',
    tone: 'warning'
  },
  PROVEEDOR_INVALIDO: {
    title: 'Proveedor no reconocido',
    description: 'Uno de los proveedores no coincide con tu cotización. Recarga la página para actualizar la información.',
    tone: 'error'
  },
  ITEM_INVALIDO: {
    title: 'Producto no reconocido',
    description: 'Uno de los productos no coincide con tu cotización. Recarga la página e intenta guardar otra vez.',
    tone: 'error'
  },
  FORMULARIO_CERRADO: {
    title: 'Formulario cerrado',
    description: 'Coordinación cerró este proveedor. Ya no puedes editar ni guardar cambios hasta que lo reabran.',
    tone: 'warning'
  },
  ENLACE_INVALIDO: {
    title: 'Enlace inválido',
    description: 'El enlace que abriste no es válido. Solicita a coordinación un nuevo acceso al formulario.',
    tone: 'error'
  },
  ERROR_INTERNO: {
    title: 'Algo salió mal',
    description: 'No pudimos completar la operación. Intenta nuevamente en unos minutos o contacta a coordinación.',
    tone: 'error'
  },
  VALIDACION_LOCAL: {
    title: 'Faltan datos por completar',
    description: 'Revisa los campos obligatorios marcados antes de guardar.',
    tone: 'warning'
  },
  FORMULARIO_CERRADO_LOCAL: {
    title: 'Formulario cerrado',
    description: 'Este proveedor está cerrado. No puedes guardar cambios en este momento.',
    tone: 'warning'
  }
}

export class ClientApiError extends Error {
  readonly title: string
  readonly description: string
  readonly code?: string
  readonly tone: ClientMessageTone
  readonly status?: number

  constructor(payload: ClientMessage & { status?: number }) {
    super(payload.description)
    this.name = 'ClientApiError'
    this.title = payload.title
    this.description = payload.description
    this.code = payload.code
    this.tone = payload.tone ?? 'error'
    this.status = payload.status
  }
}

const isApiErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' && value !== null

export const toClientMessage = (
  input: unknown,
  fallbackCode = 'ERROR_INTERNO'
): ClientMessage => {
  if (input instanceof ClientApiError) {
    return {
      title: input.title,
      description: input.description,
      code: input.code,
      tone: input.tone
    }
  }

  if (typeof input === 'string' && input.trim()) {
    const known = FALLBACK_MESSAGES[fallbackCode]
    if (known && !Object.values(FALLBACK_MESSAGES).some((item) => item.description === input)) {
      return { ...known, description: input, code: fallbackCode }
    }
    return FALLBACK_MESSAGES[fallbackCode] ?? FALLBACK_MESSAGES.ERROR_INTERNO
  }

  return FALLBACK_MESSAGES[fallbackCode] ?? FALLBACK_MESSAGES.ERROR_INTERNO
}

export const parseClientApiError = (error: unknown): ClientApiError => {
  const fetchError = error as {
    statusCode?: number
    status?: number
    data?: ApiErrorBody
    message?: string
  }

  const status = fetchError.statusCode ?? fetchError.status
  const body = isApiErrorBody(fetchError.data) ? fetchError.data : null
  const code = body?.code || (status === 404 ? 'COTIZACION_NOT_FOUND' : 'ERROR_INTERNO')
  const fallback = FALLBACK_MESSAGES[code] ?? FALLBACK_MESSAGES.ERROR_INTERNO

  const title = body?.title?.trim() || fallback.title
  const description = body?.message?.trim() || fallback.description
  const tone = fallback.tone ?? 'error'

  return new ClientApiError({
    title,
    description,
    code,
    tone,
    status
  })
}

export const clientMessageFromCode = (
  code: string,
  overrideDescription?: string
): ClientMessage => {
  const fallback = FALLBACK_MESSAGES[code] ?? FALLBACK_MESSAGES.ERROR_INTERNO
  return {
    ...fallback,
    code,
    description: overrideDescription?.trim() || fallback.description
  }
}
