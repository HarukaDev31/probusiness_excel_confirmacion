/**
 * Header X-Org-Key desde runtimeConfig.public.orgKey.
 */
export function getOrgKeyHeader(): Record<string, string> {
  const config = useRuntimeConfig()
  const key = String(config.public.orgKey || '').trim()
  if (!key) {
    throw new Error('NUXT_PUBLIC_ORG_KEY no configurado: no se puede llamar a la API sin organización')
  }
  return { 'X-Org-Key': key }
}
