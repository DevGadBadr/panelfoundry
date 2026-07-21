import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PopupModal } from '@/components/ui/popup-modal'
import { DialogFooter } from '@/components/ui/dialog'
import { ComponentForm } from '@/components/ComponentForm'
import { ComponentDetail } from '@/components/ComponentDetail'
import { componentsApi } from '@/api/components'
import type { Component } from '@/api/types'
import {
  loadPanelState,
  savePanelState,
  type PanelMode,
} from '@/lib/panelStorage'
import { cn } from '@/lib/utils'

const COMPONENTS_TABLE_WIDTHS = {
  serial_number: 144,
  name: 200,
  type: 112,
  dimensions: 96,
  temp: 80,
  coated: 64,
  actions: 64,
} as const

const PANEL_WIDTH_PX = 420
const PANEL_TRANSITION_MS = 300

const restored = loadPanelState()

export function ComponentsPage() {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<PanelMode | null>(restored?.panel ?? null)
  const [selectedSerial, setSelectedSerial] = useState<string | null>(
    restored?.selectedSerial ?? null,
  )
  const [draft, setDraft] = useState<Partial<Component> | null>(
    restored?.draft ?? null,
  )
  const [panelClosing, setPanelClosing] = useState(false)
  const [transitionsReady, setTransitionsReady] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Component | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['components'],
    queryFn: () => componentsApi.list(),
  })

  const components = data?.results ?? []

  const selected = useMemo(() => {
    if (!selectedSerial) return null
    return components.find((c) => c.serial_number === selectedSerial) ?? null
  }, [components, selectedSerial])

  // Enable CSS transitions after first paint so restored panels don't slide in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setTransitionsReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const clearPanelState = useCallback(() => {
    setSelectedSerial(null)
    setDraft(null)
    setPanel(null)
    setPanelClosing(false)
  }, [])

  const cancelCloseAnimation = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setPanelClosing(false)
  }, [])

  // Persist panel state whenever it changes. Only cleared on manual dismiss.
  useEffect(() => {
    if (!panel || panelClosing) {
      savePanelState(null)
      return
    }
    savePanelState({
      panel,
      selectedSerial,
      draft: panel === 'create' || panel === 'edit' ? draft : null,
    })
  }, [panel, selectedSerial, draft, panelClosing])

  // If restored detail/edit points at a deleted component, drop the panel.
  useEffect(() => {
    if (isLoading || !data) return
    if ((panel === 'detail' || panel === 'edit') && selectedSerial && !selected) {
      cancelCloseAnimation()
      clearPanelState()
    }
  }, [isLoading, data, panel, selectedSerial, selected, cancelCloseAnimation, clearPanelState])

  const persistDraft = useCallback((next: Partial<Component>) => {
    setDraft(next)
  }, [])

  const createMut = useMutation({
    mutationFn: (d: Partial<Component>) =>
      componentsApi.create(d as Omit<Component, 'created_at' | 'updated_at' | 'pricelist_id'>),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      cancelCloseAnimation()
      setDraft(null)
      setSelectedSerial(created.serial_number)
      setPanel('detail')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ sn, d }: { sn: string; d: Partial<Omit<Component, 'pricelist_id'>> }) =>
      componentsApi.update(sn, d),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      cancelCloseAnimation()
      setDraft(null)
      setSelectedSerial(updated.serial_number)
      setPanel('detail')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (sn: string) => componentsApi.delete(sn),
    onSuccess: (_data, sn) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      setDeleteTarget(null)
      if (selectedSerial === sn) {
        cancelCloseAnimation()
        clearPanelState()
      }
    },
  })

  const openCreate = () => {
    cancelCloseAnimation()
    setSelectedSerial(null)
    setDraft(null)
    setPanel('create')
  }

  const openDetail = (c: Component) => {
    cancelCloseAnimation()
    setDraft(null)
    setSelectedSerial(c.serial_number)
    setPanel('detail')
  }

  const openEdit = (c: Component, e: React.MouseEvent) => {
    e.stopPropagation()
    cancelCloseAnimation()
    setDraft(null)
    setSelectedSerial(c.serial_number)
    setPanel('edit')
  }

  const closePanel = () => {
    if (!panel || panelClosing) return
    setPanelClosing(true)
    savePanelState(null)
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      clearPanelState()
    }, PANEL_TRANSITION_MS)
  }

  const cancelEdit = () => {
    setDraft(null)
    setPanel('detail')
  }

  const requestDelete = (c: Component, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(c)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.serial_number)
  }

  // Keep panel mounted while closing so the slide-out can finish.
  const panelMounted = panel !== null
  const panelOpen = panelMounted && !panelClosing
  const panelTitle =
    panel === 'create'
      ? 'New Component'
      : panel === 'edit' && selectedSerial
        ? `Edit — ${selectedSerial}`
        : selectedSerial ?? ''

  // Form initial: prefer persisted draft over live component.
  const formInitial =
    draft ??
    (panel === 'edit' && selected ? selected : undefined)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h1 className="text-base font-semibold">Components</h1>
          <p className="text-xs text-muted-foreground">
            {data?.count ?? 0} components in catalog
          </p>
        </div>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Add Component
        </Button>
      </div>

      {/* Split: table + inline side panel */}
      <div
        className={cn(
          'flex flex-1 min-h-0 overflow-hidden',
          panelOpen ? 'gap-3' : 'gap-0',
          transitionsReady && 'transition-[gap] duration-300 ease-in-out',
        )}
      >
        <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-sm text-destructive">
              Failed to load components. Is the API running?
            </div>
          )}
          {!isLoading && !error && (
            <Table
              storageKey="foundry.table.components"
              defaultColumnWidths={COMPONENTS_TABLE_WIDTHS}
            >
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead columnId="serial_number">Serial Number</TableHead>
                  <TableHead columnId="name">Name</TableHead>
                  <TableHead columnId="type">Type</TableHead>
                  <TableHead columnId="dimensions">W × H (mm)</TableHead>
                  <TableHead columnId="temp">Temp °C</TableHead>
                  <TableHead columnId="coated">Coated</TableHead>
                  <TableHead columnId="actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      No components yet. Add the first one.
                    </TableCell>
                  </TableRow>
                )}
                {components.map((c) => {
                  const isSelected =
                    panel !== 'create' && selectedSerial === c.serial_number && panelOpen
                  return (
                    <TableRow
                      key={c.serial_number}
                      className={`text-xs cursor-pointer ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => openDetail(c)}
                    >
                      <TableCell className="font-mono font-medium">{c.serial_number}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.width_mm && c.height_mm
                          ? `${c.width_mm} × ${c.height_mm}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.env_temp_c != null ? c.env_temp_c : '—'}
                      </TableCell>
                      <TableCell>
                        {c.env_coated ? (
                          <Badge className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => openEdit(c, e)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => requestDelete(c, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <aside
          className={cn(
            'shrink-0 overflow-hidden',
            transitionsReady && 'transition-[width] duration-300 ease-in-out',
          )}
          style={{ width: panelOpen ? PANEL_WIDTH_PX : 0 }}
          aria-hidden={!panelOpen}
        >
          <div
            className={cn(
              'flex h-full flex-col bg-background border-l',
              transitionsReady && 'transition-transform duration-300 ease-in-out',
              panelOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            style={{ width: PANEL_WIDTH_PX }}
          >
            {panelMounted && (
              <>
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
                  <h2
                    className={`text-sm font-medium truncate ${
                      panel === 'detail' ? 'font-mono' : ''
                    }`}
                  >
                    {panelTitle}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={closePanel}
                    aria-label="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {panel === 'create' && (
                    <ComponentForm
                      key="create"
                      initial={draft ?? undefined}
                      onChange={persistDraft}
                      onSubmit={(d) => createMut.mutateAsync(d)}
                      onCancel={closePanel}
                    />
                  )}
                  {panel === 'edit' && selectedSerial && (
                    // Wait for component to resolve from list when restoring after reload
                    selected ? (
                      <ComponentForm
                        key={`edit-${selectedSerial}`}
                        initial={formInitial}
                        isEdit
                        onChange={persistDraft}
                        onSubmit={(d) =>
                          updateMut.mutateAsync({ sn: selectedSerial, d })
                        }
                        onCancel={cancelEdit}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    )
                  )}
                  {panel === 'detail' && (
                    selected ? (
                      <ComponentDetail component={selected} />
                    ) : (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <PopupModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTarget(null)
        }}
        title="Delete component?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.serial_number}. This action cannot be undone.`
            : undefined
        }
        size="sm"
      >
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={deleteMut.isPending}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMut.isPending}
            onClick={handleConfirmDelete}
          >
            {deleteMut.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </PopupModal>
    </div>
  )
}
