/**
 * Header X-Org-Key desde runtimeConfig.public.orgKey.
 */
export function getOrgKeyHeader(): Record<string, string> {
  const config = useRuntimeConfig()
  const key = String(config.public.orgKey || '').trim()
  if (!key) {
    return {}
  }
  return { 'X-Org-Key': key }
}
