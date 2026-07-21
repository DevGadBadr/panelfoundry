import type { Component } from '@/api/types'

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

    const obj = parsed as Record<string, unknown>
    const panel = obj.panel
    if (panel !== 'detail' && panel !== 'create' && panel !== 'edit') return null

    const selectedSerial =
      typeof obj.selectedSerial === 'string' ? obj.selectedSerial : null

    let draft: Partial<Component> | null = null
    if (obj.draft && typeof obj.draft === 'object' && !Array.isArray(obj.draft)) {
      draft = obj.draft as Partial<Component>
    }

    // detail/edit need a serial; create may have draft only
    if ((panel === 'detail' || panel === 'edit') && !selectedSerial) return null

    return { panel, selectedSerial, draft }
  } catch {
    return null
  }
}

export function savePanelState(state: ComponentsPanelState | null) {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode errors
  }
}
