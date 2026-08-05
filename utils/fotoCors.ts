/** Evita reutilizar una entrada de caché "opaca" de una carga <img> sin CORS. */
export const withCacheBust = (url: string): string => {
  const busted = new URL(url)
  busted.searchParams.set('_cb', String(Date.now()))
  return busted.toString()
}

/**
 * Descarga bytes de la imagen para copiar al portapapeles.
 * Nota: URLs remotas (cdn.probusiness.pe) requieren Access-Control-Allow-Origin en el CDN.
 * Las fotos locales (blob/File) no tienen ese problema.
 */
export const fetchImageBlobCors = async (url: string): Promise<Blob> => {
  const normalized = String(url || '').trim()
  if (!normalized) throw new Error('URL de imagen vacía')

  if (normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    const localRes = await fetch(normalized)
    if (!localRes.ok) throw new Error('No se pudo obtener la imagen')
    return localRes.blob()
  }

  const res = await fetch(withCacheBust(normalized), {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`No se pudo obtener la imagen (${res.status})`)
  return res.blob()
}
