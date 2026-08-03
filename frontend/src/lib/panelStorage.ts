import type { Component } from '@/api/types'
import { readJson, removeItem, writeJson } from '@/lib/safeStorage'

export type PanelMode = 'detail' | 'create' | 'edit'

export type ComponentsPanelState = {
  panel: PanelMode
  /** Serial number for detail / edit modes. */
  selectedSerial: string | null
  /** In-progress create / edit form values. */
  draft: Partial<Component> | null
}

const STORAGE_KEY = 'foundry.components.panel'

export function loadPanelState(): ComponentsPanelState | null {
  const parsed = readJson<Record<string, unknown>>(STORAGE_KEY)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const panel = parsed.panel
  if (panel !== 'detail' && panel !== 'create' && panel !== 'edit') return null

  const selectedSerial =
    typeof parsed.selectedSerial === 'string' ? parsed.selectedSerial : null

  let draft: Partial<Component> | null = null
  if (parsed.draft && typeof parsed.draft === 'object' && !Array.isArray(parsed.draft)) {
    draft = parsed.draft as Partial<Component>
  }

  // detail/edit need a serial; create may have draft only
  if ((panel === 'detail' || panel === 'edit') && !selectedSerial) return null

  return { panel, selectedSerial, draft }
}

export function savePanelState(state: ComponentsPanelState | null) {
  if (!state) {
    removeItem(STORAGE_KEY)
    return
  }
  writeJson(STORAGE_KEY, state)
}
