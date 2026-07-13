import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ProveedorFormState } from '~/types/excelConfirmacion'

const DB_NAME = 'excel-confirmacion'
const DB_VERSION = 1
const STORE_NAME = 'drafts'
const LEGACY_SESSION_PREFIX = 'excel-confirmacion-draft:'

export interface FormDraft {
  uuid: string
  savedAt: string
  formState: ProveedorFormState[]
  tempIdCounter: number
}

interface ExcelConfirmacionDB extends DBSchema {
  drafts: {
    key: string
    value: FormDraft
  }
}

let dbPromise: Promise<IDBPDatabase<ExcelConfirmacionDB>> | null = null

function getDb() {
  if (!import.meta.client) return null

  if (!dbPromise) {
    dbPromise = openDB<ExcelConfirmacionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'uuid' })
        }
      }
    })
  }

  return dbPromise
}

/** Limpia borradores viejos en sessionStorage de versiones anteriores. */
function clearLegacySessionDraft(uuid: string) {
  if (!import.meta.client) return
  sessionStorage.removeItem(`${LEGACY_SESSION_PREFIX}${uuid}`)
}

export async function loadFormDraft(uuid: string): Promise<FormDraft | null> {
  const db = getDb()
  if (!db || !uuid) return null

  try {
    const draft = await (await db).get(STORE_NAME, uuid)
    if (!draft || draft.uuid !== uuid || !Array.isArray(draft.formState)) return null
    return draft
  } catch {
    return null
  }
}

export async function saveFormDraft(
  uuid: string,
  formState: ProveedorFormState[],
  tempIdCounter: number
): Promise<void> {
  const db = getDb()
  if (!db || !uuid) return

  const draft: FormDraft = {
    uuid,
    savedAt: new Date().toISOString(),
    formState,
    tempIdCounter
  }

  try {
    await (await db).put(STORE_NAME, draft)
    clearLegacySessionDraft(uuid)
  } catch {
    // No bloquear la UI si falla el almacenamiento local.
  }
}

export async function clearFormDraft(uuid: string): Promise<void> {
  const db = getDb()
  if (!uuid) return

  clearLegacySessionDraft(uuid)
  if (!db) return

  try {
    await (await db).delete(STORE_NAME, uuid)
  } catch {
    // Ignorar errores al limpiar borrador local.
  }
}
