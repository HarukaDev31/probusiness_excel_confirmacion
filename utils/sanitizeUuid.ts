const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * Limpia el uuid de la ruta/query para no mandar basura al backend
 * (espacios, %20, dobles encodings, caracteres extra alrededor).
 */
export function sanitizeUuid(raw: unknown): string {
  let value = String(raw ?? '').trim()
  if (!value) return ''

  try {
    let prev = ''
    while (prev !== value && /%[0-9a-f]{2}/i.test(value)) {
      prev = value
      value = decodeURIComponent(value)
    }
  } catch {
    /* % mal formado: seguimos con el valor actual */
  }

  value = value.trim()
  const match = value.match(UUID_RE)
  return match ? match[0] : ''
}
